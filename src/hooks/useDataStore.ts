import { useState, useEffect } from 'react'
import { SalesData, HistoryData, NotificationData } from '@/types'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useSales as useSupabaseSales, useHistory as useSupabaseHistory, useNotifications as useSupabaseNotifications, addNotification } from './useSupabase'
import { useLocalStorage } from './useLocalStorage'
import { useRealtimeRefresh } from './useRealtimeRefresh'
import { useInstantUpdates, instantUpdateManager } from './useInstantUpdates'
import { useOffline } from './useOffline'
import { pushNotifications } from '@/lib/pushNotifications'

// Hybrid hook that uses Supabase if configured, otherwise localStorage
export function useSales() {
  const isConfigured = isSupabaseConfigured()
  
  // Supabase hooks
  const supabaseHooks = useSupabaseSales()
  
  // localStorage fallback
  const [localSales, setLocalSales] = useLocalStorage<SalesData[]>('wifi-voucher-sales', [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Real-time refresh trigger
  const refreshTrigger = useRealtimeRefresh([localSales])
  
  // Instant updates hook
  const { updateTrigger, addSaleInstantly } = useInstantUpdates()
  
  // Offline functionality
  const { isOnline, addOfflineAction } = useOffline()
  
  // Force re-render when refresh is triggered
  const [, forceUpdate] = useState({})
  useEffect(() => {
    forceUpdate({})
  }, [refreshTrigger, updateTrigger])
  
  // Sync instant update manager with actual data
  useEffect(() => {
    if (!isConfigured) {
      instantUpdateManager.setSalesData(localSales)
    }
  }, [localSales, isConfigured])
  
  // Auto-refresh data every 5 seconds for real-time sync
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      if (isOnline && isConfigured) {
        // Trigger background refresh for Supabase data
        supabaseHooks.refetch?.();
      }
      // Force UI update for local data changes
      forceUpdate({});
    }, 5000);
    
    return () => clearInterval(autoRefreshInterval);
  }, [isOnline, isConfigured]);

  const addSale = async (saleData: Omit<SalesData, 'id'>) => {
    if (isConfigured && isOnline) {
      try {
        return await supabaseHooks.addSale(saleData)
      } catch (error) {
        console.error('Supabase addSale failed, falling back to offline mode:', error)
        // Fall back to offline mode if Supabase fails
      }
    }
    
    // localStorage implementation (works offline)
    const newSale: SalesData = {
      id: Date.now().toString(),
      ...saleData,
    }
    
    // 🚀 INSTANT UPDATE - Show in UI immediately
    addSaleInstantly(newSale)
    
    // Update local state immediately
    setLocalSales(prev => [newSale, ...prev])
    
    // Multiple trigger methods for maximum compatibility
    window.dispatchEvent(new CustomEvent('forceDataRefresh', {
      detail: { timestamp: Date.now(), source: 'addSale' }
    }))
    
    // Force immediate re-render
    forceUpdate({})
    
    // If configured but offline, add to offline queue
    if (isConfigured && !isOnline) {
      addOfflineAction('ADD_SALE', { ...saleData, localId: newSale.id })
    }
    
    try {
      setLoading(true)
      
      // Add local notification
      const notifications = JSON.parse(localStorage.getItem('wifi-voucher-notifications') || '[]')
      const newNotification: NotificationData = {
        id: Date.now().toString(),
        message: `Penjualan baru ditambahkan: ${saleData.namaPelanggan} - ${saleData.paket} ${!isOnline ? '(offline)' : ''}`,
        type: 'success',
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem('wifi-voucher-notifications', JSON.stringify([newNotification, ...notifications.slice(0, 49)]))
      
      // Send push notification
      pushNotifications.transactionCreated(
        saleData.namaPelanggan,
        saleData.paket,
        saleData.harga,
        newSale
      )
      
      return newSale
    } catch (err) {
      // Rollback on error
      setLocalSales(prev => prev.filter(sale => sale.id !== newSale.id))
      instantUpdateManager.removeSaleInstantly(newSale.id)
      setError('Gagal menambah penjualan')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateSale = async (id: string, saleData: Partial<SalesData>) => {
    if (isConfigured && isOnline) {
      try {
        return await supabaseHooks.updateSale(id, saleData)
      } catch (error) {
        console.error('Supabase updateSale failed, falling back to offline mode:', error)
        // Fall back to offline mode
      }
    }
    
    // localStorage implementation (works offline)
    setLoading(true)
    try {
      const previousData = localSales.find(sale => sale.id === id)
      const updatedSale = { ...previousData, ...saleData }
      
      setLocalSales(prev => prev.map(sale => 
        sale.id === id ? updatedSale : sale
      ))
      
      // Immediate UI refresh
      window.dispatchEvent(new CustomEvent('forceDataRefresh', {
        detail: { timestamp: Date.now(), source: 'updateSale' }
      }))
      
      // If configured but offline, add to offline queue
      if (isConfigured && !isOnline) {
        addOfflineAction('UPDATE_SALE', { id, data: saleData })
      }
      
      const notifications = JSON.parse(localStorage.getItem('wifi-voucher-notifications') || '[]')
      const newNotification: NotificationData = {
        id: Date.now().toString(),
        message: `Penjualan diperbarui: ${saleData.namaPelanggan || 'Unknown'} ${!isOnline ? '(offline)' : ''}`,
        type: 'info',
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem('wifi-voucher-notifications', JSON.stringify([newNotification, ...notifications.slice(0, 49)]))
      
      // Send push notification for edit
      if (updatedSale.namaPelanggan && updatedSale.paket) {
        pushNotifications.transactionEdited(
          updatedSale.namaPelanggan,
          updatedSale.paket,
          {
            id: updatedSale.id,
            changes: saleData,
            previousData,
            updatedData: updatedSale
          }
        )
      }
      
      return updatedSale
    } catch (err) {
      setError('Gagal memperbarui penjualan')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteSale = async (id: string) => {
    if (isConfigured && isOnline) {
      try {
        return await supabaseHooks.deleteSale(id)
      } catch (error) {
        console.error('Supabase deleteSale failed, falling back to offline mode:', error)
        // Fall back to offline mode
      }
    }
    
    // localStorage implementation (works offline)
    setLoading(true)
    try {
      // Get sale data before deletion for notification
      const saleToDelete = localSales.find(sale => sale.id === id)
      
      setLocalSales(prev => prev.filter(sale => sale.id !== id))
      
      // Immediate UI refresh
      window.dispatchEvent(new CustomEvent('forceDataRefresh', {
        detail: { timestamp: Date.now(), source: 'deleteSale' }
      }))
      
      // If configured but offline, add to offline queue
      if (isConfigured && !isOnline && saleToDelete) {
        addOfflineAction('DELETE_SALE', { id, saleData: saleToDelete })
      }
      
      const notifications = JSON.parse(localStorage.getItem('wifi-voucher-notifications') || '[]')
      const newNotification: NotificationData = {
        id: Date.now().toString(),
        message: `Penjualan dihapus ${!isOnline ? '(offline)' : ''}`,
        type: 'info',
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem('wifi-voucher-notifications', JSON.stringify([newNotification, ...notifications.slice(0, 49)]))
      
      // Send push notification for delete
      if (saleToDelete) {
        pushNotifications.transactionDeleted(
          saleToDelete.namaPelanggan,
          saleToDelete.paket,
          {
            id: saleToDelete.id,
            deletedData: saleToDelete,
            deletedAt: new Date().toISOString()
          }
        )
      }
    } catch (err) {
      setError('Gagal menghapus penjualan')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refetch = async () => {
    if (isConfigured) {
      return await supabaseHooks.refetch()
    }
    // For localStorage, data is already synced
  }

  if (isConfigured) {
    return {
      sales: supabaseHooks.sales,
      loading: supabaseHooks.loading,
      error: supabaseHooks.error,
      addSale,
      updateSale,
      deleteSale,
      refetch,
    }
  }

  return {
    sales: localSales,
    loading,
    error,
    addSale,
    updateSale,
    deleteSale,
    refetch,
  }
}

export function useHistory() {
  const isConfigured = isSupabaseConfigured()
  const supabaseHooks = useSupabaseHistory()
  const [localHistory, setLocalHistory] = useLocalStorage<HistoryData[]>('wifi-voucher-history', [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Real-time refresh trigger
  const refreshTrigger = useRealtimeRefresh([localHistory])
  
  // Offline functionality
  const { isOnline, addOfflineAction } = useOffline()
  
  // Force re-render when refresh is triggered
  const [, forceUpdate] = useState({})
  useEffect(() => {
    forceUpdate({})
  }, [refreshTrigger])
  
  // Auto-refresh history data every 5 seconds
  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      if (isOnline && isConfigured) {
        // Trigger background refresh for Supabase data
        supabaseHooks.refetch?.();
      }
      // Force UI update for local data changes
      forceUpdate({});
    }, 5000);
    
    return () => clearInterval(autoRefreshInterval);
  }, [isOnline, isConfigured]);

  const moveToHistory = async (salesId: string, tanggalSetor: string) => {
    if (isConfigured && isOnline) {
      try {
        return await supabaseHooks.moveToHistory(salesId, tanggalSetor)
      } catch (error) {
        console.error('Supabase moveToHistory failed, falling back to offline mode:', error)
        // Fall back to offline mode
      }
    }
    
    // localStorage implementation (works offline)
    setLoading(true)
    try {
      // Get sales data from localStorage
      const sales = JSON.parse(localStorage.getItem('wifi-voucher-sales') || '[]')
      const salesData = sales.find((sale: SalesData) => sale.id === salesId)
      
      if (!salesData) {
        throw new Error('Sales data not found')
      }

      const historyData: HistoryData = {
        ...salesData,
        tanggalSetor,
        id: Date.now().toString(),
      }

      setLocalHistory(prev => [historyData, ...prev])
      
      // Immediate UI refresh
      window.dispatchEvent(new CustomEvent('forceDataRefresh', {
        detail: { timestamp: Date.now(), source: 'moveToHistory' }
      }))
      
      // If configured but offline, add to offline queue
      if (isConfigured && !isOnline) {
        addOfflineAction('MOVE_TO_HISTORY', { salesId, tanggalSetor, historyData })
      }
      
      const notifications = JSON.parse(localStorage.getItem('wifi-voucher-notifications') || '[]')
      const newNotification: NotificationData = {
        id: Date.now().toString(),
        message: `Penjualan dipindah ke history: ${salesData.namaPelanggan} ${!isOnline ? '(offline)' : ''}`,
        type: 'success',
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem('wifi-voucher-notifications', JSON.stringify([newNotification, ...notifications.slice(0, 49)]))
      
      return historyData
    } catch (err) {
      setError('Gagal memindah ke history')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteHistory = async (id: string) => {
    if (isConfigured && isOnline) {
      try {
        return await supabaseHooks.deleteHistory(id)
      } catch (error) {
        console.error('Supabase deleteHistory failed, falling back to offline mode:', error)
        // Fall back to offline mode
      }
    }
    
    // localStorage implementation (works offline)
    setLoading(true)
    try {
      // Get history data before deletion for notification
      const historyToDelete = localHistory.find(h => h.id === id)
      
      setLocalHistory(prev => prev.filter(history => history.id !== id))
      
      // Immediate UI refresh
      window.dispatchEvent(new CustomEvent('forceDataRefresh', {
        detail: { timestamp: Date.now(), source: 'deleteHistory' }
      }))
      
      // If configured but offline, add to offline queue
      if (isConfigured && !isOnline && historyToDelete) {
        addOfflineAction('DELETE_HISTORY', { id, historyData: historyToDelete })
      }
      
      const notifications = JSON.parse(localStorage.getItem('wifi-voucher-notifications') || '[]')
      const newNotification: NotificationData = {
        id: Date.now().toString(),
        message: `Riwayat setoran dihapus ${!isOnline ? '(offline)' : ''}`,
        type: 'info',
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem('wifi-voucher-notifications', JSON.stringify([newNotification, ...notifications.slice(0, 49)]))
      
      // Send push notification for history delete
      if (historyToDelete) {
        pushNotifications.historyDeleted(
          historyToDelete.namaPelanggan,
          new Date(historyToDelete.tanggalSetor).toLocaleDateString('id-ID'),
          {
            id: historyToDelete.id,
            deletedData: historyToDelete,
            deletedAt: new Date().toISOString()
          }
        )
      }
    } catch (err) {
      setError('Gagal menghapus riwayat setoran')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refetch = async () => {
    if (isConfigured) {
      return await supabaseHooks.refetch()
    }
  }

  if (isConfigured) {
    return {
      history: supabaseHooks.history,
      loading: supabaseHooks.loading,
      error: supabaseHooks.error,
      moveToHistory,
      deleteHistory,
      refetch,
    }
  }

  return {
    history: localHistory,
    loading,
    error,
    moveToHistory,
    deleteHistory,
    refetch,
  }
}

export function useNotifications() {
  const isConfigured = isSupabaseConfigured()
  const supabaseHooks = useSupabaseNotifications()
  const [localNotifications, setLocalNotifications] = useLocalStorage<NotificationData[]>('wifi-voucher-notifications', [])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isConfigured) {
      // Poll for localStorage changes for real-time effect
      const interval = setInterval(() => {
        const stored = localStorage.getItem('wifi-voucher-notifications')
        if (stored) {
          const notifications = JSON.parse(stored)
          setLocalNotifications(notifications)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [isConfigured, setLocalNotifications])

  if (isConfigured) {
    return {
      notifications: supabaseHooks.notifications,
      loading: supabaseHooks.loading,
    }
  }

  return {
    notifications: localNotifications,
    loading,
  }
}