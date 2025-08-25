// Service Worker Registration and Management
import { useState, useEffect } from 'react';

export interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdating: boolean;
  hasUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
}

class ServiceWorkerManager {
  private state: ServiceWorkerState = {
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdating: false,
    hasUpdate: false,
    registration: null,
  };

  private listeners: Set<(state: ServiceWorkerState) => void> = new Set();

  constructor() {
    if (this.state.isSupported) {
      this.register();
      this.setupMessageListener();
    }
  }

  // Subscribe to state changes
  subscribe(callback: (state: ServiceWorkerState) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  private notify() {
    this.listeners.forEach(callback => callback(this.state));
  }

  // Register service worker
  private async register() {
    try {
      console.log('🔧 Registering Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      this.state.registration = registration;
      this.state.isRegistered = true;
      
      console.log('✅ Service Worker registered successfully');
      
      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          this.state.isUpdating = true;
          this.notify();
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              this.state.hasUpdate = true;
              this.state.isUpdating = false;
              this.notify();
              
              console.log('🔄 New Service Worker version available');
              
              // Show update notification
              this.showUpdateNotification();
            }
          });
        }
      });

      // Handle controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed - reloading page');
        window.location.reload();
      });

      this.notify();
      
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }

  // Setup message listener for SW communication
  private setupMessageListener() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('📨 Message from Service Worker:', event.data);
      
      if (event.data && event.data.type === 'BACKGROUND_SYNC') {
        // Trigger offline sync
        window.dispatchEvent(new CustomEvent('backgroundSync', {
          detail: { timestamp: event.data.timestamp }
        }));
      }
    });
  }

  // Show update notification
  private showUpdateNotification() {
    // Create a simple notification for update
    const notification = document.createElement('div');
    notification.className = `
      fixed top-4 right-4 z-50 p-4 bg-blue-600 text-white rounded-lg shadow-lg 
      transform transition-transform duration-300 translate-x-0
    `;
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <div>
          <p class="font-medium">Update Available!</p>
          <p class="text-sm opacity-90">Click to refresh and get the latest version</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
          ✕
        </button>
      </div>
    `;
    
    notification.addEventListener('click', () => {
      this.updateServiceWorker();
      notification.remove();
    });
    
    document.body.appendChild(notification);
    
    // Auto remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  // Update service worker
  updateServiceWorker() {
    if (this.state.registration && this.state.registration.waiting) {
      // Tell the waiting SW to skip waiting
      this.state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Get current state
  getState(): ServiceWorkerState {
    return { ...this.state };
  }

  // Trigger background sync
  triggerBackgroundSync() {
    if (this.state.registration && 'sync' in this.state.registration) {
      return (this.state.registration as any).sync.register('offline-sync');
    }
    return Promise.resolve();
  }

  // Update cache with new URLs
  updateCache(urls: string[]) {
    if (this.state.registration && this.state.registration.active) {
      this.state.registration.active.postMessage({
        type: 'CACHE_UPDATE',
        urls: urls
      });
    }
  }

  // Check if app is installed (PWA)
  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Prompt for installation
  async promptInstallation(): Promise<boolean> {
    if ('beforeinstallprompt' in window) {
      try {
        const deferredPrompt = (window as any).deferredPrompt;
        if (deferredPrompt) {
          deferredPrompt.prompt();
          const result = await deferredPrompt.userChoice;
          return result.outcome === 'accepted';
        }
      } catch (error) {
        console.error('Installation prompt failed:', error);
      }
    }
    return false;
  }
}

// Global instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Hook for using service worker
export function useServiceWorker() {
  const [swState, setSwState] = useState<ServiceWorkerState>(serviceWorkerManager.getState());

  useEffect(() => {
    const unsubscribe = serviceWorkerManager.subscribe(setSwState);
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    ...swState,
    updateServiceWorker: () => serviceWorkerManager.updateServiceWorker(),
    triggerBackgroundSync: () => serviceWorkerManager.triggerBackgroundSync(),
    updateCache: (urls: string[]) => serviceWorkerManager.updateCache(urls),
    isInstalled: serviceWorkerManager.isInstalled(),
    promptInstallation: () => serviceWorkerManager.promptInstallation(),
  };
}