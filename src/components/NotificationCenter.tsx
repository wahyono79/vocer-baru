import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Settings, Trash2, Eye, EyeOff } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useDataStore';
import { initializePushNotifications, PushNotificationService } from '@/lib/pushNotifications';

export default function NotificationCenter() {
  const { notifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [pushService, setPushService] = useState<PushNotificationService | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Initialize push notification service
    const service = initializePushNotifications();
    setPushService(service);
    setPermissionStatus(service.getPermissionStatus());
    setIsSupported(service.isNotificationSupported());

    // Update unread count (simulate - in real app, track read status)
    setUnreadCount(Math.min(notifications.length, 5));
  }, [notifications]);

  const handleRequestPermission = async () => {
    if (pushService) {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
    }
  };

  const handleTestNotification = () => {
    if (pushService) {
      pushService.sendPushNotification({
        title: 'Test Notification',
        message: 'Ini adalah test push notification untuk aplikasi voucher WiFi',
        type: 'info',
        action: 'create',
        targetAudience: ['penjual', 'pemilik'],
        data: { test: true }
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} jam lalu`;
    return date.toLocaleDateString('id-ID');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getPermissionBadge = () => {
    switch (permissionStatus) {
      case 'granted':
        return <Badge variant="default" className="bg-green-500">Aktif</Badge>;
      case 'denied':
        return <Badge variant="destructive">Ditolak</Badge>;
      default:
        return <Badge variant="secondary">Belum Diatur</Badge>;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 text-xs rounded-full p-0 flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifikasi Push
              </CardTitle>
              {getPermissionBadge()}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Notification Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Status Browser:</span>
                <div className="flex items-center gap-2">
                  {isSupported ? (
                    <>
                      <span className="text-green-600">Didukung</span>
                      <Eye className="h-3 w-3 text-green-600" />
                    </>
                  ) : (
                    <>
                      <span className="text-red-600">Tidak Didukung</span>
                      <EyeOff className="h-3 w-3 text-red-600" />
                    </>
                  )}
                </div>
              </div>

              {/* Permission Request */}
              {isSupported && permissionStatus !== 'granted' && (
                <Button 
                  onClick={handleRequestPermission}
                  size="sm" 
                  className="w-full"
                  variant={permissionStatus === 'denied' ? 'outline' : 'default'}
                >
                  <Settings className="h-3 w-3 mr-2" />
                  {permissionStatus === 'denied' ? 'Izin Ditolak - Aktifkan Manual' : 'Aktifkan Notifikasi'}
                </Button>
              )}

              {/* Test Notification */}
              {permissionStatus === 'granted' && (
                <Button 
                  onClick={handleTestNotification}
                  size="sm" 
                  variant="outline"
                  className="w-full"
                >
                  <Bell className="h-3 w-3 mr-2" />
                  Test Notifikasi
                </Button>
              )}
            </div>

            {/* Recent Notifications */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-600 border-t pt-3">
                Notifikasi Terbaru ({notifications.length})
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-4">
                    <BellOff className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Belum ada notifikasi
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <div 
                      key={notification.id}
                      className="p-3 border rounded-lg text-xs space-y-1 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2 flex-1">
                          <span className="text-lg">
                            {getNotificationIcon(notification.type)}
                          </span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {notification.message}
                            </p>
                            <p className="text-gray-500 mt-1">
                              {formatDate(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            notification.type === 'success' ? 'default' :
                            notification.type === 'error' ? 'destructive' : 'secondary'
                          }
                          className="text-xs"
                        >
                          {notification.type}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notification Info */}
            <div className="text-xs text-gray-500 border-t pt-3 space-y-1">
              <p><strong>💡 Tips:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Notifikasi akan muncul untuk setiap edit/hapus transaksi</li>
                <li>Push notification bekerja di background</li>
                <li>Notifikasi dikirim ke Penjual dan Pemilik</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}