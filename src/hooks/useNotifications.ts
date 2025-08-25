import { useState, useCallback } from 'react';
import { NotificationData } from '@/types';
import { toast } from 'sonner';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const notification: NotificationData = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date().toISOString(),
    };

    setNotifications(prev => [notification, ...prev]);

    // Show toast notification
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      default:
        toast.info(message);
    }

    // Simulate sending notification to seller and owner
    console.log('📢 Notifikasi untuk Penjual:', message);
    console.log('📢 Notifikasi untuk Pemilik:', message);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    clearNotifications,
  };
}