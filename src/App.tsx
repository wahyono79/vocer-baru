import { useState, useEffect } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import SplashScreen from '@/components/SplashScreen';
import { useAndroidBackButton } from '@/hooks/useAndroidBackButton';
import { appStateManager } from '@/utils/appStateManager';
import Index from './pages/Index';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  // Setup Android back button handler with double-press to exit
  useAndroidBackButton({
    exitOnBackButton: true,
    confirmExit: false, // Disable confirmation since we use double-press
    doubleBackToExit: true,
    doubleBackTimeout: 2000,
    exitMessage: 'Keluar dari Aplikasi Voucher WiFi?'
  });

  useEffect(() => {
    let appStateListener: any;
    let resumeListener: any;

    const setupAppLifecycle = async () => {
      if (Capacitor.isNativePlatform()) {
        console.log('Setting up app lifecycle listeners');

        // Check if app is stuck and reset if needed
        if (appStateManager.isAppStuck()) {
          console.warn('App appears to be stuck, forcing reset...');
          await appStateManager.forceReset();
          return;
        }

        // Mark splash screen start
        appStateManager.markSplashStart();

        // Listen for app state changes
        appStateListener = await CapacitorApp.addListener('appStateChange', (state) => {
          console.log('App state changed:', state);
          
          if (state.isActive) {
            console.log('App resumed - resetting to fresh state');
            // Update activity
            appStateManager.updateActivity();
            
            // Reset app to fresh state when resumed
            setAppReady(false);
            setShowSplash(true);
            appStateManager.markSplashStart();
            
            // Allow splash screen to complete normally
            setTimeout(() => {
              setAppReady(true);
            }, 100);
          } else {
            console.log('App backgrounded');
            appStateManager.clearSplashMarker();
          }
        });

        // Listen for app resume events
        resumeListener = await CapacitorApp.addListener('resume', () => {
          console.log('App resume event - ensuring fresh start');
          // Update activity
          appStateManager.updateActivity();
          
          // Force fresh start
          setAppReady(false);
          setShowSplash(true);
          appStateManager.markSplashStart();
          
          setTimeout(() => {
            setAppReady(true);
          }, 100);
        });
      }
      
      // Mark app as ready for initial load
      appStateManager.updateActivity();
      setAppReady(true);
    };

    setupAppLifecycle();

    return () => {
      if (appStateListener) {
        console.log('Cleaning up app state listener');
        appStateListener.remove();
      }
      if (resumeListener) {
        console.log('Cleaning up resume listener');
        resumeListener.remove();
      }
    };
  }, []);

  const handleSplashComplete = () => {
    console.log('Splash screen completed');
    appStateManager.clearSplashMarker();
    appStateManager.updateActivity();
    setShowSplash(false);
  };

  // Don't render anything until app is ready
  if (!appReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-600">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {showSplash ? (
          <SplashScreen onComplete={handleSplashComplete} duration={3000} />
        ) : (
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
