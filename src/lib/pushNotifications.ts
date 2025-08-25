import { toast } from 'sonner';

// Types for push notification
export interface PushNotificationData {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  action: 'create' | 'update' | 'delete';
  targetAudience: ('penjual' | 'pemilik')[];
  data?: any;
}

// Enhanced notification service
export class PushNotificationService {
  private static instance: PushNotificationService;
  private isSupported: boolean = false;
  private permission: NotificationPermission = 'default';

  constructor() {
    this.checkBrowserSupport();
    this.requestPermission();
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  private checkBrowserSupport(): void {
    this.isSupported = 'Notification' in window;
  }

  private async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('Browser does not support notifications');
      return 'denied';
    }

    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    return this.permission;
  }

  // Enhanced push notification with multiple targets
  async sendPushNotification(data: PushNotificationData): Promise<void> {
    // Always show in-app toast notification
    this.showToastNotification(data);

    // Show browser push notification if supported and permitted
    if (this.isSupported && this.permission === 'granted') {
      this.showBrowserNotification(data);
    }

    // Log notifications for different audiences
    this.logNotificationForAudiences(data);

    // Simulate real-time push to mobile/other devices (placeholder)
    this.simulateMobilePush(data);
  }

  private showToastNotification(data: PushNotificationData): void {
    const message = `${data.title}: ${data.message}`;
    
    switch (data.type) {
      case 'success':
        toast.success(message, {
          duration: 4000,
          action: data.action === 'update' ? {
            label: 'Lihat Detail',
            onClick: () => console.log('View details clicked', data.data)
          } : undefined
        });
        break;
      case 'error':
        toast.error(message, { duration: 6000 });
        break;
      case 'warning':
        toast.warning(message, { duration: 5000 });
        break;
      default:
        toast.info(message, { duration: 3000 });
    }
  }

  private showBrowserNotification(data: PushNotificationData): void {
    const notification = new Notification(data.title, {
      body: data.message,
      icon: '/favicon.ico', // Add your app icon
      badge: '/favicon.ico',
      tag: `${data.action}-${data.data?.id || Date.now()}`, // Prevent duplicate notifications
      requireInteraction: data.type === 'error', // Keep error notifications visible
    });

    // Handle notification clicks
    notification.onclick = () => {
      window.focus(); // Focus the app window
      notification.close();
      
      // You can add navigation logic here
      console.log('Notification clicked:', data);
    };

    // Auto-close after 5 seconds for non-error notifications
    if (data.type !== 'error') {
      setTimeout(() => notification.close(), 5000);
    }
  }

  private logNotificationForAudiences(data: PushNotificationData): void {
    data.targetAudience.forEach(audience => {
      const audienceLabel = audience === 'penjual' ? '👨‍💼 Penjual' : '👨‍💻 Pemilik';
      const actionIcon = this.getActionIcon(data.action);
      
      console.log(`📱 ${audienceLabel} - ${actionIcon} ${data.title}: ${data.message}`);
      
      // Log detailed info for debugging
      if (data.data) {
        console.log(`   📊 Data:`, data.data);
      }
    });
  }

  private simulateMobilePush(data: PushNotificationData): void {
    // Simulate sending to mobile app or external push service
    // In a real implementation, you would send to:
    // - Firebase Cloud Messaging (FCM)
    // - Apple Push Notification Service (APNS)
    // - Web Push API
    // - Custom webhook endpoints
    
    console.log('📲 Simulating mobile push notification:', {
      platform: 'mobile',
      recipients: data.targetAudience,
      payload: {
        title: data.title,
        body: data.message,
        data: data.data
      }
    });
  }

  private getActionIcon(action: string): string {
    switch (action) {
      case 'create': return '➕';
      case 'update': return '✏️';
      case 'delete': return '🗑️';
      default: return '📢';
    }
  }

  // Get notification permission status
  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  // Check if notifications are supported
  isNotificationSupported(): boolean {
    return this.isSupported;
  }
}

// Enhanced notification functions for different actions
export const pushNotifications = {
  // Transaction Edit Notification
  transactionEdited: (customerName: string, paket: string, data?: any) => {
    PushNotificationService.getInstance().sendPushNotification({
      title: 'Transaksi Diperbarui',
      message: `Data penjualan ${customerName} (${paket}) telah diperbarui`,
      type: 'info',
      action: 'update',
      targetAudience: ['penjual', 'pemilik'],
      data: data
    });
  },

  // Transaction Delete Notification
  transactionDeleted: (customerName: string, paket: string, data?: any) => {
    PushNotificationService.getInstance().sendPushNotification({
      title: 'Transaksi Dihapus',
      message: `Data penjualan ${customerName} (${paket}) telah dihapus`,
      type: 'warning',
      action: 'delete',
      targetAudience: ['penjual', 'pemilik'],
      data: data
    });
  },

  // History Delete Notification
  historyDeleted: (customerName: string, depositDate: string, data?: any) => {
    PushNotificationService.getInstance().sendPushNotification({
      title: 'Riwayat Setoran Dihapus',
      message: `Riwayat setoran ${customerName} (${depositDate}) telah dihapus`,
      type: 'warning',
      action: 'delete',
      targetAudience: ['penjual', 'pemilik'],
      data: data
    });
  },

  // Transaction Created Notification (enhanced)
  transactionCreated: (customerName: string, paket: string, amount: number, data?: any) => {
    PushNotificationService.getInstance().sendPushNotification({
      title: 'Transaksi Baru',
      message: `Penjualan baru: ${customerName} - ${paket} (Rp ${amount.toLocaleString('id-ID')})`,
      type: 'success',
      action: 'create',
      targetAudience: ['penjual', 'pemilik'],
      data: data
    });
  },

  // Deposit Notification (enhanced)
  depositMade: (transactionCount: number, totalAmount: number, data?: any) => {
    PushNotificationService.getInstance().sendPushNotification({
      title: 'Setoran Berhasil',
      message: `${transactionCount} transaksi disetor dengan total Rp ${totalAmount.toLocaleString('id-ID')}`,
      type: 'success',
      action: 'create',
      targetAudience: ['penjual', 'pemilik'],
      data: data
    });
  }
};

// Initialize the service
export const initializePushNotifications = () => {
  return PushNotificationService.getInstance();
};
