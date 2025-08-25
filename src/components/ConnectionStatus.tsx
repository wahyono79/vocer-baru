import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cloud, CloudOff, Wifi, WifiOff } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSupabaseReady, setIsSupabaseReady] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check Supabase configuration
    setIsSupabaseReady(isSupabaseConfigured())

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {isSupabaseReady ? (
                <Cloud className="h-4 w-4 text-blue-500" />
              ) : (
                <CloudOff className="h-4 w-4 text-gray-500" />
              )}
              <span className="text-sm">
                {isSupabaseReady ? 'Cloud Sync' : 'Local Storage'}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Connected' : 'Disconnected'}
            </Badge>
            <Badge variant={isSupabaseReady ? 'default' : 'secondary'}>
              {isSupabaseReady ? 'Supabase' : 'localStorage'}
            </Badge>
          </div>
        </div>
        
        {!isSupabaseReady && (
          <div className="mt-2 text-xs text-muted-foreground">
            💡 Untuk mengaktifkan sinkronisasi cloud, konfigurasikan Supabase di file .env
          </div>
        )}
      </CardContent>
    </Card>
  )
}