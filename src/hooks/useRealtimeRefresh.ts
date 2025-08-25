import { useEffect, useState, useRef } from 'react';

interface RefreshEvent {
  timestamp: number;
  source?: string;
}

export function useRealtimeRefresh(deps: any[] = []) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    const handleRefresh = (event: CustomEvent<RefreshEvent>) => {
      const { timestamp } = event.detail;
      
      // Prevent duplicate refreshes
      if (timestamp > lastRefreshRef.current) {
        lastRefreshRef.current = timestamp;
        setRefreshTrigger(prev => prev + 1);
      }
    };

    // Listen for force refresh events
    window.addEventListener('forceDataRefresh', handleRefresh as EventListener);
    
    return () => {
      window.removeEventListener('forceDataRefresh', handleRefresh as EventListener);
    };
  }, []);

  // Also trigger refresh when dependencies change
  useEffect(() => {
    if (deps.length > 0) {
      setRefreshTrigger(prev => prev + 1);
    }
  }, deps);

  return refreshTrigger;
}