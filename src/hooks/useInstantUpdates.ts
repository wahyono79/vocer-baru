import { useState, useEffect, useCallback } from 'react';
import { SalesData, HistoryData } from '@/types';

// Global state manager for instant updates
class InstantUpdateManager {
  private listeners: Set<() => void> = new Set();
  private salesData: SalesData[] = [];
  private historyData: HistoryData[] = [];

  // Subscribe to instant updates
  subscribe(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners immediately
  private notify() {
    this.listeners.forEach(callback => callback());
  }

  // Instantly add sales data
  addSaleInstantly(sale: SalesData) {
    this.salesData = [sale, ...this.salesData];
    this.notify();
    // Also trigger global refresh event
    window.dispatchEvent(new CustomEvent('instantDataUpdate', {
      detail: { type: 'sales', action: 'add', data: sale, timestamp: Date.now() }
    }));
  }

  // Instantly update sales data
  updateSaleInstantly(id: string, updatedSale: SalesData) {
    this.salesData = this.salesData.map(sale => 
      sale.id === id ? updatedSale : sale
    );
    this.notify();
    window.dispatchEvent(new CustomEvent('instantDataUpdate', {
      detail: { type: 'sales', action: 'update', data: updatedSale, timestamp: Date.now() }
    }));
  }

  // Instantly remove sales data
  removeSaleInstantly(id: string) {
    const removedSale = this.salesData.find(sale => sale.id === id);
    this.salesData = this.salesData.filter(sale => sale.id !== id);
    this.notify();
    window.dispatchEvent(new CustomEvent('instantDataUpdate', {
      detail: { type: 'sales', action: 'delete', data: removedSale, timestamp: Date.now() }
    }));
  }

  // Get current sales data
  getSalesData() {
    return this.salesData;
  }

  // Set sales data (for syncing with actual data store)
  setSalesData(data: SalesData[]) {
    this.salesData = data;
    this.notify();
  }

  // Clear all data
  clear() {
    this.salesData = [];
    this.historyData = [];
    this.notify();
  }
}

// Global instance
const instantUpdateManager = new InstantUpdateManager();

// Hook for instant updates
export function useInstantUpdates() {
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const unsubscribe = instantUpdateManager.subscribe(() => {
      setUpdateTrigger(prev => prev + 1);
    });

    // Also listen for global instant update events
    const handleInstantUpdate = () => {
      setUpdateTrigger(prev => prev + 1);
    };

    window.addEventListener('instantDataUpdate', handleInstantUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('instantDataUpdate', handleInstantUpdate);
    };
  }, []);

  return {
    updateTrigger,
    instantUpdateManager,
    // Convenience methods
    addSaleInstantly: useCallback((sale: SalesData) => {
      instantUpdateManager.addSaleInstantly(sale);
    }, []),
    updateSaleInstantly: useCallback((id: string, sale: SalesData) => {
      instantUpdateManager.updateSaleInstantly(id, sale);
    }, []),
    removeSaleInstantly: useCallback((id: string) => {
      instantUpdateManager.removeSaleInstantly(id);
    }, []),
  };
}

export { instantUpdateManager };