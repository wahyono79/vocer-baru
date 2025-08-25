import { useEffect, useState } from 'react';
import { CheckCircle, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { isSupabaseConfigured } from '@/lib/supabase';

interface SyncIndicatorProps {
  className?: string;
}

interface SyncActivity {
  id: string;
  type: 'add' | 'update' | 'delete' | 'moveToHistory';
  timestamp: number;
  source: string;
}

export function SyncIndicator({ className }: SyncIndicatorProps) {
  const [recentActivity, setRecentActivity] = useState<SyncActivity[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const isConnected = isSupabaseConfigured();

  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const { timestamp, source } = event.detail;
      
      // Add to recent activity
      const activity: SyncActivity = {
        id: `${timestamp}-${source}`,
        type: getActivityType(source),
        timestamp,
        source
      };
      
      setRecentActivity(prev => [activity, ...prev.slice(0, 4)]);
      
      // Trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
      
      // Show toast for immediate feedback
      const message = getActivityMessage(activity.type, source);
      toast.success(message, {
        duration: 2000,
        icon: getActivityIcon(activity.type)
      });
    };

    window.addEventListener('forceDataRefresh', handleDataRefresh as EventListener);
    
    return () => {
      window.removeEventListener('forceDataRefresh', handleDataRefresh as EventListener);
    };
  }, []);

  const getActivityType = (source: string): SyncActivity['type'] => {
    if (source.includes('add')) return 'add';
    if (source.includes('update')) return 'update';
    if (source.includes('delete')) return 'delete';
    if (source.includes('moveToHistory')) return 'moveToHistory';
    return 'add';
  };

  const getActivityMessage = (type: SyncActivity['type'], source: string): string => {
    switch (type) {
      case 'add':
        return '✅ Data baru ditambahkan!';
      case 'update':
        return '✏️ Data berhasil diperbarui!';
      case 'delete':
        return '🗑️ Data berhasil dihapus!';
      case 'moveToHistory':
        return '📦 Data dipindah ke riwayat!';
      default:
        return '🔄 Data disinkronkan!';
    }
  };

  const getActivityIcon = (type: SyncActivity['type']) => {
    switch (type) {
      case 'add':
        return '✅';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'moveToHistory':
        return '📦';
      default:
        return '🔄';
    }
  };

  const hasRecentActivity = recentActivity.length > 0;
  const lastActivity = recentActivity[0];
  const timeSinceLastActivity = lastActivity 
    ? Date.now() - lastActivity.timestamp 
    : null;

  return (
    <div className={cn(
      "flex items-center space-x-2 text-sm",
      className
    )}>
      {/* Connection Status */}
      <div className="flex items-center space-x-1">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-gray-400" />
        )}
        <span className={cn(
          "text-xs",
          isConnected ? "text-green-600" : "text-gray-500"
        )}>
          {isConnected ? 'Cloud' : 'Local'}
        </span>
      </div>

      {/* Sync Activity Indicator */}
      {hasRecentActivity && timeSinceLastActivity && timeSinceLastActivity < 5000 && (
        <div className={cn(
          "flex items-center space-x-1 transition-all duration-500",
          isAnimating && "animate-pulse"
        )}>
          <div className={cn(
            "flex items-center space-x-1 px-2 py-1 rounded-full text-xs",
            "bg-green-100 text-green-700 border border-green-200",
            isAnimating && "animate-bounce"
          )}>
            <CheckCircle className="h-3 w-3" />
            <span>Tersinkron</span>
          </div>
        </div>
      )}

      {/* Real-time indicator */}
      {isAnimating && (
        <div className="flex items-center space-x-1">
          <div className="animate-spin">
            <RefreshCw className="h-3 w-3 text-blue-500" />
          </div>
          <span className="text-xs text-blue-600">
            Memperbarui...
          </span>
        </div>
      )}
    </div>
  );
}