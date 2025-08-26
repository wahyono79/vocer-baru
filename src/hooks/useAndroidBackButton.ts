import { useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

interface UseAndroidBackButtonOptions {
  onBackButton?: () => void;
  exitOnBackButton?: boolean;
  confirmExit?: boolean;
  exitMessage?: string;
  doubleBackToExit?: boolean;
  doubleBackTimeout?: number;
}

export const useAndroidBackButton = (options: UseAndroidBackButtonOptions = {}) => {
  const {
    onBackButton,
    exitOnBackButton = true,
    confirmExit = true,
    exitMessage = 'Apakah Anda yakin ingin keluar dari aplikasi?',
    doubleBackToExit = true,
    doubleBackTimeout = 2000
  } = options;

  const lastBackPress = useRef<number>(0);

  useEffect(() => {
    let backButtonListener: any;
    let appStateListener: any;

    const setupBackButtonHandler = async () => {
      // Only setup for native Android platform
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        console.log('Setting up Android back button handler');

        // Listen for app state changes
        appStateListener = await CapacitorApp.addListener('appStateChange', (state) => {
          console.log('App state changed:', state);
          if (state.isActive) {
            console.log('App is now active');
          } else {
            console.log('App is now inactive/background');
          }
        });

        backButtonListener = await CapacitorApp.addListener('backButton', async (event) => {
          console.log('Back button pressed', event);

          // If there's a custom back button handler, use it
          if (onBackButton) {
            onBackButton();
            return;
          }

          // Default behavior: exit app
          if (exitOnBackButton) {
            if (doubleBackToExit) {
              const currentTime = Date.now();
              if (currentTime - lastBackPress.current < doubleBackTimeout) {
                // Second press within timeout - exit the app
                if (confirmExit) {
                  const userConfirmed = window.confirm(exitMessage);
                  if (userConfirmed) {
                    await performExit();
                  }
                } else {
                  await performExit();
                }
              } else {
                // First press - show toast and set timer
                lastBackPress.current = currentTime;
                toast.info('Tekan sekali lagi untuk keluar', {
                  duration: doubleBackTimeout
                });
              }
            } else {
              // Single press to exit
              if (confirmExit) {
                const userConfirmed = window.confirm(exitMessage);
                if (userConfirmed) {
                  await performExit();
                }
              } else {
                await performExit();
              }
            }
          }
        });

        console.log('Android back button handler setup complete');
      }
    };

    setupBackButtonHandler();

    // Cleanup function
    return () => {
      if (backButtonListener) {
        console.log('Cleaning up back button listener');
        backButtonListener.remove();
      }
      if (appStateListener) {
        console.log('Cleaning up app state listener');
        appStateListener.remove();
      }
    };
  }, [onBackButton, exitOnBackButton, confirmExit, exitMessage, doubleBackToExit, doubleBackTimeout]);

  const performExit = async () => {
    try {
      console.log('Attempting to minimize app instead of exit to prevent stuck state');
      // Use minimizeApp instead of exitApp to prevent stuck state on reopen
      await CapacitorApp.minimizeApp();
      toast.info('App diminimalkan', { duration: 1000 });
    } catch (error) {
      console.error('Error minimizing app:', error);
      // Fallback: try to exit the app
      try {
        console.log('Fallback: attempting to exit app');
        await CapacitorApp.exitApp();
      } catch (exitError) {
        console.error('Error exiting app:', exitError);
        toast.error('Tidak dapat keluar dari aplikasi');
      }
    }
  };

  // Function to manually exit the app
  const exitApp = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await CapacitorApp.exitApp();
      } else {
        // For web, close the window or go back in history
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.close();
        }
      }
    } catch (error) {
      console.error('Error exiting app:', error);
      toast.error('Tidak dapat keluar dari aplikasi');
    }
  };

  // Function to minimize the app
  const minimizeApp = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await CapacitorApp.minimizeApp();
        toast.info('App diminimalkan');
      }
    } catch (error) {
      console.error('Error minimizing app:', error);
      toast.error('Tidak dapat meminimalkan aplikasi');
    }
  };

  return {
    exitApp,
    minimizeApp
  };
};