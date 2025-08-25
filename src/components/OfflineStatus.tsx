import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, RefreshCw, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOffline } from '@/hooks/useOffline';
import { toast } from 'sonner';

interface OfflineStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function OfflineStatus({ className, showDetails = true }: OfflineStatusProps) {
  const { 
    isOnline, 
    pendingCount, 
    syncInProgress, 
    lastSyncTime, 
    forceSync, 
    clearQueue,
    needsSync,
    canSync 
  } = useOffline();

  const [isAnimating, setIsAnimating] = useState(false);
  const [showAutoSync, setShowAutoSync] = useState(false);
  const [showOnlineText, setShowOnlineText] = useState(true);

  // Animate when status changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [isOnline]);

  // Listen for sync events
  useEffect(() => {
    const handleOfflineSync = (event: CustomEvent) => {
      const { success, failed } = event.detail;
      if (success > 0 || failed > 0) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 2000);
      }
    };

    window.addEventListener('offlineSync', handleOfflineSync as EventListener);
    
    return () => {
      window.removeEventListener('offlineSync', handleOfflineSync as EventListener);
    };
  }, []);
  
  // Auto-sync indicator - show briefly every 5 seconds when online and has pending data
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      const autoSyncTimer = setInterval(() => {
        setShowAutoSync(true);
        setTimeout(() => setShowAutoSync(false), 1000);
      }, 5000);
      
      return () => clearInterval(autoSyncTimer);
    }
  }, [isOnline, pendingCount]);
  
  // Fade out online text after 3 seconds when online
  useEffect(() => {
    if (isOnline) {
      setShowOnlineText(true);
      const fadeTimer = setTimeout(() => {
        setShowOnlineText(false);
      }, 3000); // Hide after 3 seconds
      
      return () => clearTimeout(fadeTimer);
    } else {
      // Always show text when offline
      setShowOnlineText(true);
    }
  }, [isOnline]);

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Belum pernah sync';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} jam lalu`;
    return date.toLocaleDateString('id-ID');
  };

  const handleForceSync = () => {
    if (canSync && needsSync) {
      forceSync();
      toast.info('🔄 Memulai sinkronisasi...');
    } else if (!isOnline) {
      toast.error('❌ Tidak dapat sync - sedang offline');
    } else if (!needsSync) {
      toast.info('✅ Semua data sudah tersinkron');
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-center space-x-4 p-2 rounded-lg border",
      isOnline ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200",
      isAnimating && "animate-pulse",
      className
    )}>
      {/* Connection Status */}
      <div className={cn(
        "flex items-center space-x-2",
        isAnimating && "animate-bounce"
      )}>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-orange-600" />
        )}
        
        <span className={cn(
          "text-sm font-medium flex items-center space-x-1 transition-opacity duration-1000",
          isOnline ? "text-green-700" : "text-orange-700",
          isOnline && !showOnlineText && "opacity-0"
        )}>
          <span>{isOnline ? '🌐 Online' : 'Offline'}</span>
          {isOnline && showOnlineText && (
            <span className={cn(
              "text-xs text-green-600 opacity-75 transition-opacity duration-1000",
              !showOnlineText && "opacity-0"
            )}>
              Tersambung ke cloud (Auto-sync 5s)
            </span>
          )}
        </span>
      </div>

      {/* Pending Actions Badge */}
      {pendingCount > 0 && (
        <Badge 
          variant={isOnline ? "default" : "secondary"}
          className={cn(
            "flex items-center space-x-1",
            isOnline ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
          )}
        >
          <Upload className="h-3 w-3" />
          <span>{pendingCount} pending</span>
        </Badge>
      )}

      {/* Sync Status */}
      {(syncInProgress || showAutoSync) && (
        <div className="flex items-center space-x-1 text-blue-600">
          <RefreshCw className={cn(
            "h-4 w-4",
            (syncInProgress || showAutoSync) && "animate-spin"
          )} />
          <span className="text-sm">
            {syncInProgress ? 'Syncing...' : 'Auto-sync'}
          </span>
        </div>
      )}

      {/* Force Sync Button - Only show if needed */}
      {isOnline && needsSync && !syncInProgress && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleForceSync}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Sync
        </Button>
      )}

      {/* Warning for offline with pending actions */}
      {!isOnline && pendingCount > 0 && (
        <div className="flex items-center space-x-1 text-orange-600">
          <AlertCircle className="h-3 w-3" />
          <span className="text-xs">
            Will sync when online
          </span>
        </div>
      )}
    </div>
  );
}