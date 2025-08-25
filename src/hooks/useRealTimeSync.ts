import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { isSupabaseConfigured } from '@/lib/supabase';

// Types for real-time sync feedback
export interface SyncFeedback {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  message: string;
  progress: number;
}

export interface SyncAnimation {
  itemId: string;
  type: 'add' | 'update' | 'delete';
  timestamp: number;
}

// Enhanced hook for real-time data synchronization with visual feedback
export function useRealTimeSync() {
  const [syncFeedback, setSyncFeedback] = useState<SyncFeedback>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
    progress: 0
  });

  const [recentAnimations, setRecentAnimations] = useState<SyncAnimation[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const progressIntervalRef = useRef<NodeJS.Timeout>();

  // Start sync operation with visual feedback
  const startSync = useCallback((message: string = 'Menyimpan data...') => {
    setSyncFeedback({
      isLoading: true,
      isSuccess: false,
      isError: false,
      message,
      progress: 0
    });

    // Simulate progress animation
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += Math.random() * 20;
      if (progress > 90) progress = 90; // Cap at 90% until completion
      
      setSyncFeedback(prev => ({ ...prev, progress }));
    }, 100);

  }, []);

  // Complete sync operation successfully
  const completeSync = useCallback((
    message: string = 'Data berhasil disimpan!',
    itemId?: string,
    animationType: SyncAnimation['type'] = 'add'
  ) => {
    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Complete progress to 100%
    setSyncFeedback({
      isLoading: false,
      isSuccess: true,
      isError: false,
      message,
      progress: 100
    });

    // Add animation for new item
    if (itemId) {
      const animation: SyncAnimation = {
        itemId,
        type: animationType,
        timestamp: Date.now()
      };
      
      setRecentAnimations(prev => [animation, ...prev.slice(0, 4)]); // Keep last 5 animations
    }

    // Update last sync time
    setLastSyncTime(new Date());

    // Show success toast with enhanced feedback
    const getToastMessage = () => {
      switch (animationType) {
        case 'add': return `✅ ${message}`;
        case 'update': return `✏️ ${message}`;
        case 'delete': return `🗑️ ${message}`;
        default: return message;
      }
    };

    toast.success(getToastMessage(), {
      duration: 3000,
      action: {
        label: 'Lihat',
        onClick: () => {
          // Scroll to the new item or highlight it
          if (itemId) {
            const element = document.querySelector(`[data-item-id="${itemId}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              element.classList.add('animate-pulse');
              setTimeout(() => element.classList.remove('animate-pulse'), 2000);
            }
          }
        }
      }
    });

    // Clear success state after delay
    timeoutRef.current = setTimeout(() => {
      setSyncFeedback(prev => ({ ...prev, isSuccess: false, message: '', progress: 0 }));
    }, 3000);

  }, []);

  // Handle sync error
  const errorSync = useCallback((message: string = 'Gagal menyimpan data') => {
    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    setSyncFeedback({
      isLoading: false,
      isSuccess: false,
      isError: true,
      message,
      progress: 0
    });

    // Show error toast
    toast.error(`❌ ${message}`, {
      duration: 5000,
      action: {
        label: 'Coba Lagi',
        onClick: () => {
          // Could trigger retry logic here
          setSyncFeedback(prev => ({ ...prev, isError: false, message: '' }));
        }
      }
    });

    // Clear error state after delay
    timeoutRef.current = setTimeout(() => {
      setSyncFeedback(prev => ({ ...prev, isError: false, message: '' }));
    }, 5000);

  }, []);

  // Clear feedback manually
  const clearFeedback = useCallback(() => {
    setSyncFeedback({
      isLoading: false,
      isSuccess: false,
      isError: false,
      message: '',
      progress: 0
    });
  }, []);

  // Get sync status for UI display
  const getSyncStatus = useCallback(() => {
    const isSupabaseMode = isSupabaseConfigured();
    const timeSinceLastSync = lastSyncTime ? Date.now() - lastSyncTime.getTime() : null;
    
    return {
      mode: isSupabaseMode ? 'cloud' : 'local',
      isConnected: isSupabaseMode,
      lastSync: lastSyncTime,
      timeSinceLastSync,
      isRecent: timeSinceLastSync ? timeSinceLastSync < 5000 : false, // Recent if within 5 seconds
    };
  }, [lastSyncTime]);

  // Trigger force refresh for real-time updates
  const triggerRefresh = useCallback(() => {
    // Dispatch custom event for components to refresh their data
    window.dispatchEvent(new CustomEvent('forceDataRefresh', {
      detail: { timestamp: Date.now() }
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return {
    // Feedback states
    syncFeedback,
    recentAnimations,
    lastSyncTime,
    
    // Control functions
    startSync,
    completeSync,
    errorSync,
    clearFeedback,
    
    // Utility functions
    getSyncStatus,
    triggerRefresh,
  };
}

// Helper hook for components that need to listen to data refresh events
export function useDataRefreshListener(onRefresh: () => void) {
  useEffect(() => {
    const handleRefresh = (event: CustomEvent) => {
      console.log('🔄 Force data refresh triggered:', event.detail);
      onRefresh();
    };

    window.addEventListener('forceDataRefresh', handleRefresh as EventListener);
    
    return () => {
      window.removeEventListener('forceDataRefresh', handleRefresh as EventListener);
    };
  }, [onRefresh]);
}

// Enhanced optimistic update helper
export function useOptimisticUpdates<T extends { id: string }>(
  data: T[],
  setData: React.Dispatch<React.SetStateAction<T[]>>
) {
  const [optimisticData, setOptimisticData] = useState<T[]>(data);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(new Set());

  // Sync optimistic data with actual data
  useEffect(() => {
    setOptimisticData(data);
  }, [data]);

  const addOptimistic = useCallback((item: T) => {
    setPendingOperations(prev => new Set([...prev, item.id]));
    setOptimisticData(prev => [item, ...prev]);
    
    // Add visual indicator class
    setTimeout(() => {
      const element = document.querySelector(`[data-item-id="${item.id}"]`);
      if (element) {
        element.classList.add('opacity-75', 'animate-pulse');
      }
    }, 50);
    
    return item;
  }, []);

  const confirmOptimistic = useCallback((itemId: string) => {
    setPendingOperations(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    
    // Remove visual indicators
    setTimeout(() => {
      const element = document.querySelector(`[data-item-id="${itemId}"]`);
      if (element) {
        element.classList.remove('opacity-75', 'animate-pulse');
        element.classList.add('animate-bounce');
        setTimeout(() => element.classList.remove('animate-bounce'), 1000);
      }
    }, 50);
  }, []);

  const revertOptimistic = useCallback((itemId: string) => {
    setPendingOperations(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
    
    setOptimisticData(prev => prev.filter(item => item.id !== itemId));
  }, []);

  return {
    optimisticData,
    pendingOperations,
    addOptimistic,
    confirmOptimistic,
    revertOptimistic,
  };
}