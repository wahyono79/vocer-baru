import { useState, useEffect } from 'react'
import { supabase, type Database } from '@/lib/supabase'
import type { SalesData, HistoryData, NotificationData } from '@/types'
import { pushNotifications } from '@/lib/pushNotifications'

type SalesRow = Database['public']['Tables']['sales']['Row']
type HistoryRow = Database['public']['Tables']['history']['Row']
type NotificationRow = Database['public']['Tables']['notifications']['Row']

// Convert database row to app types
const convertSalesRow = (row: SalesRow): SalesData => ({
  id: row.id,
  tanggal: row.tanggal,
  namaPelanggan: row.nama_pelanggan,
  paket: row.paket,
  harga: row.harga,
  kodeVoucher: row.kode_voucher,
  feePenjual: row.fee_penjual,
  setoranBersih: row.setoran_bersih,
})

const convertHistoryRow = (row: HistoryRow): HistoryData => ({
  id: row.id,
  tanggal: row.tanggal,
  namaPelanggan: row.nama_pelanggan,
  paket: row.paket as SalesData['paket'],
  harga: row.harga,
  kodeVoucher: row.kode_voucher,
  feePenjual: row.fee_penjual,
  setoranBersih: row.setoran_bersih,
  tanggalSetor: row.tanggal_setor,
})

const convertNotificationRow = (row: NotificationRow): NotificationData => ({
  id: row.id,
  message: row.message,
  type: row.type,
  timestamp: row.timestamp,
})

export function useSales() {
  const [sales, setSales] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSales = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('tanggal', { ascending: false })

      if (error) throw error

      setSales(data?.map(convertSalesRow) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const addSale = async (saleData: Omit<SalesData, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .insert({
          tanggal: saleData.tanggal,
          nama_pelanggan: saleData.namaPelanggan,
          paket: saleData.paket,
          harga: saleData.harga,
          kode_voucher: saleData.kodeVoucher,
          fee_penjual: saleData.feePenjual,
          setoran_bersih: saleData.setoranBersih,
        })
        .select()
        .single()

      if (error) throw error

      const newSale = convertSalesRow(data)
      setSales(prev => [newSale, ...prev])

      // Add notification
      await addNotification(`Penjualan baru ditambahkan: ${saleData.namaPelanggan} - ${saleData.paket}`, 'success')
      
      // Send push notification
      pushNotifications.transactionCreated(
        saleData.namaPelanggan,
        saleData.paket,
        saleData.harga,
        newSale
      )

      return newSale
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal menambah penjualan'
      setError(errorMsg)
      await addNotification(errorMsg, 'error')
      throw err
    }
  }

  const updateSale = async (id: string, saleData: Partial<SalesData>) => {
    try {
      const updateData: Record<string, any> = {}
      if (saleData.tanggal) updateData.tanggal = saleData.tanggal
      if (saleData.namaPelanggan) updateData.nama_pelanggan = saleData.namaPelanggan
      if (saleData.paket) updateData.paket = saleData.paket
      if (saleData.harga) updateData.harga = saleData.harga
      if (saleData.kodeVoucher) updateData.kode_voucher = saleData.kodeVoucher
      if (saleData.feePenjual) updateData.fee_penjual = saleData.feePenjual
      if (saleData.setoranBersih) updateData.setoran_bersih = saleData.setoranBersih

      const { data, error } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const updatedSale = convertSalesRow(data)
      setSales(prev => prev.map(sale => sale.id === id ? updatedSale : sale))

      await addNotification(`Penjualan diperbarui: ${updatedSale.namaPelanggan}`, 'info')
      
      // Send push notification for edit
      pushNotifications.transactionEdited(
        updatedSale.namaPelanggan,
        updatedSale.paket,
        {
          id: updatedSale.id,
          changes: saleData,
          updatedData: updatedSale
        }
      )

      return updatedSale
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal memperbarui penjualan'
      setError(errorMsg)
      await addNotification(errorMsg, 'error')
      throw err
    }
  }

  const deleteSale = async (id: string) => {
    try {
      // Get sale data before deletion for notification
      const saleToDelete = sales.find(sale => sale.id === id)
      
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id)

      if (error) throw error

      setSales(prev => prev.filter(sale => sale.id !== id))
      await addNotification('Penjualan dihapus', 'info')
      
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
      const errorMsg = err instanceof Error ? err.message : 'Gagal menghapus penjualan'
      setError(errorMsg)
      await addNotification(errorMsg, 'error')
      throw err
    }
  }

  useEffect(() => {
    fetchSales()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('sales_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'sales' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newSale = convertSalesRow(payload.new as SalesRow)
            setSales(prev => {
              // Avoid duplicates
              if (prev.some(sale => sale.id === newSale.id)) return prev
              return [newSale, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            const updatedSale = convertSalesRow(payload.new as SalesRow)
            setSales(prev => prev.map(sale => sale.id === updatedSale.id ? updatedSale : sale))
          } else if (payload.eventType === 'DELETE') {
            setSales(prev => prev.filter(sale => sale.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    sales,
    loading,
    error,
    addSale,
    updateSale,
    deleteSale,
    refetch: fetchSales,
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('history')
        .select('*')
        .order('tanggal_setor', { ascending: false })

      if (error) throw error

      setHistory(data?.map(convertHistoryRow) || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const moveToHistory = async (salesId: string, tanggalSetor: string) => {
    try {
      // Get the sales data first
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', salesId)
        .single()

      if (salesError) throw salesError

      // Insert into history
      const { data, error } = await supabase
        .from('history')
        .insert({
          sales_id: salesId,
          tanggal: salesData.tanggal,
          nama_pelanggan: salesData.nama_pelanggan,
          paket: salesData.paket,
          harga: salesData.harga,
          kode_voucher: salesData.kode_voucher,
          fee_penjual: salesData.fee_penjual,
          setoran_bersih: salesData.setoran_bersih,
          tanggal_setor: tanggalSetor,
        })
        .select()
        .single()

      if (error) throw error

      const newHistory = convertHistoryRow(data)
      setHistory(prev => [newHistory, ...prev])

      await addNotification(`Penjualan dipindah ke history: ${salesData.nama_pelanggan}`, 'success')
      
      // Send push notification for deposit
      pushNotifications.depositMade(
        1, // Single transaction
        salesData.setoran_bersih,
        {
          historyId: newHistory.id,
          salesId: salesId,
          customerName: salesData.nama_pelanggan,
          depositDate: tanggalSetor
        }
      )

      return newHistory
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal memindah ke history'
      setError(errorMsg)
      await addNotification(errorMsg, 'error')
      throw err
    }
  }

  const deleteHistory = async (id: string) => {
    try {
      // Get history data before deletion for notification
      const historyToDelete = history.find(h => h.id === id)
      
      const { error } = await supabase
        .from('history')
        .delete()
        .eq('id', id)

      if (error) throw error

      setHistory(prev => prev.filter(history => history.id !== id))
      await addNotification('Riwayat setoran dihapus', 'info')
      
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
      const errorMsg = err instanceof Error ? err.message : 'Gagal menghapus riwayat setoran'
      setError(errorMsg)
      await addNotification(errorMsg, 'error')
      throw err
    }
  }

  useEffect(() => {
    fetchHistory()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('history_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'history' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newHistory = convertHistoryRow(payload.new as HistoryRow)
            setHistory(prev => {
              if (prev.some(h => h.id === newHistory.id)) return prev
              return [newHistory, ...prev]
            })
          } else if (payload.eventType === 'DELETE') {
            setHistory(prev => prev.filter(h => h.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    history,
    loading,
    error,
    moveToHistory,
    deleteHistory,
    refetch: fetchHistory,
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50)

      if (error) throw error

      setNotifications(data?.map(convertNotificationRow) || [])
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()

    // Subscribe to real-time notifications
    const subscription = supabase
      .channel('notifications_changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotification = convertNotificationRow(payload.new as NotificationRow)
          setNotifications(prev => [newNotification, ...prev.slice(0, 49)])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    notifications,
    loading,
  }
}

// Helper function to add notifications
export async function addNotification(message: string, type: NotificationData['type']) {
  try {
    await supabase
      .from('notifications')
      .insert({
        message,
        type,
      })
  } catch (err) {
    console.error('Error adding notification:', err)
  }
}