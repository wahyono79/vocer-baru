import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

export class AppStateManager {
  private static instance: AppStateManager;
  
  public static getInstance(): AppStateManager {
    if (!AppStateManager.instance) {
      AppStateManager.instance = new AppStateManager();
    }
    return AppStateManager.instance;
  }
  
  /**
   * Force reset app state if it gets stuck
   */
  public async forceReset(): Promise<void> {
    try {
      console.log('Force resetting app state...');
      
      // Clear any persisted state
      if (typeof Storage !== 'undefined') {
        // Clear session storage but keep important data
        const importantKeys = ['sales-data', 'offline-data'];
        const backup: { [key: string]: string | null } = {};
        
        // Backup important data
        importantKeys.forEach(key => {
          backup[key] = localStorage.getItem(key);
        });
        
        // Clear session storage
        sessionStorage.clear();
        
        // Restore important data
        importantKeys.forEach(key => {
          if (backup[key]) {
            localStorage.setItem(key, backup[key]!);
          }
        });
      }
      
      // Force reload if in native app
      if (Capacitor.isNativePlatform()) {
        await this.reloadApp();
      } else {
        // In web, just reload the page
        window.location.reload();
      }
      
    } catch (error) {
      console.error('Error during force reset:', error);
    }
  }
  
  /**
   * Reload the app in native environment
   */
  private async reloadApp(): Promise<void> {
    try {
      // Get the current URL
      const currentUrl = window.location.href;
      
      // Navigate to a blank page first, then back to reload
      window.location.href = 'about:blank';
      
      setTimeout(() => {
        window.location.href = currentUrl;
      }, 100);
      
    } catch (error) {
      console.error('Error reloading app:', error);
      // Fallback: just reload
      window.location.reload();
    }
  }
  
  /**
   * Check if app is in a stuck state
   */
  public isAppStuck(): boolean {
    try {
      // Check if splash screen has been showing for too long
      const splashStartTime = sessionStorage.getItem('splash-start-time');
      if (splashStartTime) {
        const elapsed = Date.now() - parseInt(splashStartTime, 10);
        if (elapsed > 10000) { // 10 seconds
          console.warn('App appears to be stuck on splash screen');
          return true;
        }
      }
      
      // Check if app has been inactive for too long
      const lastActivity = sessionStorage.getItem('last-activity');
      if (lastActivity) {
        const elapsed = Date.now() - parseInt(lastActivity, 10);
        if (elapsed > 30000) { // 30 seconds
          console.warn('App appears to be inactive for too long');
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking app state:', error);
      return false;
    }
  }
  
  /**
   * Update last activity timestamp
   */
  public updateActivity(): void {
    try {
      sessionStorage.setItem('last-activity', Date.now().toString());
    } catch (error) {
      console.error('Error updating activity:', error);
    }
  }
  
  /**
   * Mark splash screen start
   */
  public markSplashStart(): void {
    try {
      sessionStorage.setItem('splash-start-time', Date.now().toString());
    } catch (error) {
      console.error('Error marking splash start:', error);
    }
  }
  
  /**
   * Clear splash screen marker
   */
  public clearSplashMarker(): void {
    try {
      sessionStorage.removeItem('splash-start-time');
    } catch (error) {
      console.error('Error clearing splash marker:', error);
    }
  }
}

// Export singleton instance
export const appStateManager = AppStateManager.getInstance();