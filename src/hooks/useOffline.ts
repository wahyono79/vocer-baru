import { useState, useEffect, useCallback } from 'react';
import { offlineManager, OfflineState } from '@/lib/offlineManager';

export function useOffline() {
  const [offlineState, setOfflineState] = useState<OfflineState>(offlineManager.getState());

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe(setOfflineState);
    return () => {
      unsubscribe();
    };
  }, []);

  // Add action to offline queue
  const addOfflineAction = useCallback((
    type: 'ADD_SALE' | 'UPDATE_SALE' | 'DELETE_SALE' | 'MOVE_TO_HISTORY' | 'DELETE_HISTORY',
    data: any
  ) => {
    offlineManager.addToQueue({ type, data });
  }, []);

  // Force sync when back online
  const forceSync = useCallback(() => {
    offlineManager.forcSync();
  }, []);

  // Clear offline queue
  const clearQueue = useCallback(() => {
    offlineManager.clearQueue();
  }, []);

  return {
    // State
    isOnline: offlineState.isOnline,
    lastSyncTime: offlineState.lastSyncTime,
    pendingActions: offlineState.pendingActions,
    syncInProgress: offlineState.syncInProgress,
    pendingCount: offlineState.pendingActions.length,
    
    // Actions
    addOfflineAction,
    forceSync,
    clearQueue,
    
    // Utilities
    canSync: offlineState.isOnline && !offlineState.syncInProgress,
    needsSync: offlineState.pendingActions.length > 0,
  };
}