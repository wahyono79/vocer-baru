import { SalesData, HistoryData, NotificationData } from '@/types';
import { toast } from 'sonner';

// Types for offline queue
interface OfflineAction {
  id: string;
  type: 'ADD_SALE' | 'UPDATE_SALE' | 'DELETE_SALE' | 'MOVE_TO_HISTORY' | 'DELETE_HISTORY';
  data: any;
  timestamp: number;
  retryCount: number;
}

interface OfflineState {
  isOnline: boolean;
  lastSyncTime: Date | null;
  pendingActions: OfflineAction[];
  syncInProgress: boolean;
}

class OfflineManager {
  private state: OfflineState = {
    isOnline: navigator.onLine,
    lastSyncTime: null,
    pendingActions: [],
    syncInProgress: false,
  };

  private listeners: Set<(state: OfflineState) => void> = new Set();
  private readonly OFFLINE_QUEUE_KEY = 'offline-action-queue';
  private readonly LAST_SYNC_KEY = 'last-sync-time';
  private readonly AUTO_SYNC_INTERVAL = 5000; // 5 seconds
  private autoSyncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadOfflineQueue();
    this.setupEventListeners();
    this.startAutoSync();
  }

  // Subscribe to state changes
  subscribe(callback: (state: OfflineState) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners
  private notify() {
    this.listeners.forEach(callback => callback(this.state));
  }

  // Setup network event listeners
  private setupEventListeners() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Also listen for focus/visibility changes to check connection
    window.addEventListener('focus', this.checkConnection.bind(this));
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.checkConnection();
      }
    });

    // Periodic connection check
    setInterval(() => {
      this.checkConnection();
    }, 30000); // Check every 30 seconds
  }

  // Handle going online
  private handleOnline() {
    console.log('🟢 Network: Back online');
    this.state.isOnline = true;
    this.notify();
    
    toast.success('🌐 Kembali online! Menyinkronkan data...', {
      duration: 3000,
    });

    // Sync pending actions
    this.syncPendingActions();
  }

  // Handle going offline
  private handleOffline() {
    console.log('🔴 Network: Gone offline');
    this.state.isOnline = false;
    this.notify();
    
    toast.info('📴 Mode offline aktif. Data akan disimpan lokal.', {
      duration: 4000,
    });
  }

  // Check connection status
  private async checkConnection(): Promise<boolean> {
    if (!navigator.onLine) {
      if (this.state.isOnline) {
        this.handleOffline();
      }
      return false;
    }

    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors',
      });
      
      const isActuallyOnline = true; // If fetch doesn't throw, we're online
      
      if (isActuallyOnline && !this.state.isOnline) {
        this.handleOnline();
      } else if (!isActuallyOnline && this.state.isOnline) {
        this.handleOffline();
      }
      
      return isActuallyOnline;
    } catch (error) {
      if (this.state.isOnline) {
        this.handleOffline();
      }
      return false;
    }
  }

  // Add action to offline queue
  addToQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) {
    const offlineAction: OfflineAction = {
      ...action,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.state.pendingActions.push(offlineAction);
    this.saveOfflineQueue();
    
    console.log('📦 Added to offline queue:', offlineAction);
    
    toast.info(`📂 Aksi disimpan offline (${this.state.pendingActions.length} pending)`, {
      duration: 2000,
    });
  }

  // Sync pending actions when back online
  private async syncPendingActions() {
    if (this.state.syncInProgress || !this.state.isOnline || this.state.pendingActions.length === 0) {
      return;
    }

    this.state.syncInProgress = true;
    this.notify();

    console.log(`🔄 Syncing ${this.state.pendingActions.length} offline actions...`);
    
    const actions = [...this.state.pendingActions];
    const syncResults = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const action of actions) {
      try {
        await this.executeAction(action);
        
        // Remove successful action from queue
        this.state.pendingActions = this.state.pendingActions.filter(a => a.id !== action.id);
        syncResults.success++;
        
        console.log('✅ Synced action:', action.type);
        
      } catch (error) {
        console.error('❌ Failed to sync action:', action, error);
        
        // Increment retry count
        const actionIndex = this.state.pendingActions.findIndex(a => a.id === action.id);
        if (actionIndex !== -1) {
          this.state.pendingActions[actionIndex].retryCount++;
          
          // Remove actions that have failed too many times (max 3 retries)
          if (this.state.pendingActions[actionIndex].retryCount >= 3) {
            this.state.pendingActions = this.state.pendingActions.filter(a => a.id !== action.id);
            syncResults.errors.push(`${action.type}: Max retries exceeded`);
          }
        }
        
        syncResults.failed++;
      }
    }

    this.state.syncInProgress = false;
    this.state.lastSyncTime = new Date();
    this.saveOfflineQueue();
    this.saveLastSyncTime();
    this.notify();

    // Show sync results
    if (syncResults.success > 0) {
      toast.success(`✅ Sync berhasil: ${syncResults.success} aksi`, {
        duration: 3000,
      });
    }

    if (syncResults.failed > 0) {
      toast.error(`❌ Sync gagal: ${syncResults.failed} aksi`, {
        duration: 4000,
        description: syncResults.errors.join(', '),
      });
    }

    // Trigger global sync event
    window.dispatchEvent(new CustomEvent('offlineSync', {
      detail: { success: syncResults.success, failed: syncResults.failed }
    }));
  }

  // Execute individual action
  private async executeAction(action: OfflineAction): Promise<void> {
    // Simulate API calls - replace with actual Supabase calls when online
    await new Promise(resolve => setTimeout(resolve, 100));
    
    switch (action.type) {
      case 'ADD_SALE':
        // Call actual Supabase addSale function
        console.log('Executing ADD_SALE:', action.data);
        break;
      case 'UPDATE_SALE':
        console.log('Executing UPDATE_SALE:', action.data);
        break;
      case 'DELETE_SALE':
        console.log('Executing DELETE_SALE:', action.data);
        break;
      case 'MOVE_TO_HISTORY':
        console.log('Executing MOVE_TO_HISTORY:', action.data);
        break;
      case 'DELETE_HISTORY':
        console.log('Executing DELETE_HISTORY:', action.data);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Save offline queue to localStorage
  private saveOfflineQueue() {
    try {
      localStorage.setItem(this.OFFLINE_QUEUE_KEY, JSON.stringify(this.state.pendingActions));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  // Load offline queue from localStorage
  private loadOfflineQueue() {
    try {
      const stored = localStorage.getItem(this.OFFLINE_QUEUE_KEY);
      if (stored) {
        this.state.pendingActions = JSON.parse(stored);
      }

      const lastSync = localStorage.getItem(this.LAST_SYNC_KEY);
      if (lastSync) {
        this.state.lastSyncTime = new Date(lastSync);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.state.pendingActions = [];
    }
  }

  // Save last sync time
  private saveLastSyncTime() {
    if (this.state.lastSyncTime) {
      localStorage.setItem(this.LAST_SYNC_KEY, this.state.lastSyncTime.toISOString());
    }
  }

  // Get current state
  getState(): OfflineState {
    return { ...this.state };
  }

  // Manually trigger sync
  async forcSync() {
    if (this.state.isOnline) {
      await this.syncPendingActions();
    } else {
      toast.error('❌ Tidak dapat sync - masih offline');
    }
  }

  // Clear offline queue (for testing/debug)
  clearQueue() {
    this.state.pendingActions = [];
    this.saveOfflineQueue();
    this.notify();
    toast.info('🗑️ Offline queue cleared');
  }

  // Start automatic sync every 5 seconds
  private startAutoSync() {
    this.autoSyncInterval = setInterval(() => {
      if (this.state.isOnline && this.state.pendingActions.length > 0 && !this.state.syncInProgress) {
        console.log('🔄 Auto-sync triggered - syncing pending actions...');
        this.syncPendingActions();
      }
    }, this.AUTO_SYNC_INTERVAL);
  }

  // Stop automatic sync
  private stopAutoSync() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
  }

  // Get pending actions count
  getPendingCount(): number {
    return this.state.pendingActions.length;
  }

  // Cleanup method
  cleanup() {
    this.stopAutoSync();
  }
}

// Global instance
export const offlineManager = new OfflineManager();
export type { OfflineState, OfflineAction };