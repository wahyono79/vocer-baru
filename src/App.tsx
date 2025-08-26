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
  const [showSplash, setShowSplash] = useState(Capacitor.isNativePlatform());
  const [appReady, setAppReady] = useState(!Capacitor.isNativePlatform()); // Web is ready immediately

  // Setup Android back button handler with double-press to exit (only on native)
  useAndroidBackButton({
    exitOnBackButton: true,
    confirmExit: false,
    doubleBackToExit: true,
    doubleBackTimeout: 2000,
    exitMessage: 'Keluar dari Aplikasi Voucher WiFi?'
  });

  useEffect(() => {
    let appStateListener: any;
    let resumeListener: any;

    const setupAppLifecycle = async () => {
      // Only setup complex lifecycle for native platforms
      if (Capacitor.isNativePlatform()) {
        console.log('Setting up app lifecycle listeners for native platform');

        // Check if app is stuck and reset if needed
        if (appStateManager.isAppStuck()) {
          console.warn('App appears to be stuck, forcing reset...');
          await appStateManager.forceReset();
          setAppReady(true);
          return;
        }

        // Mark splash screen start
        appStateManager.markSplashStart();

        // Listen for app state changes
        appStateListener = await CapacitorApp.addListener('appStateChange', (state) => {
          console.log('App state changed:', state);
          
          if (state.isActive) {
            console.log('App resumed - resetting to fresh state');
            appStateManager.updateActivity();
            
            setAppReady(false);
            setShowSplash(true);
            appStateManager.markSplashStart();
            
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
          appStateManager.updateActivity();
          
          setAppReady(false);
          setShowSplash(true);
          appStateManager.markSplashStart();
          
          setTimeout(() => {
            setAppReady(true);
          }, 100);
        });

        // Mark app as ready for native platforms
        appStateManager.updateActivity();
        setAppReady(true);
      } else {
        // For web, just ensure we're ready immediately
        console.log('Web platform detected - skipping splash screen');
        setShowSplash(false);
        setAppReady(true);
      }
    };

    setupAppLifecycle().catch(error => {
      console.error('Failed to setup app lifecycle:', error);
      // Fallback: ensure app is ready even if setup fails
      setAppReady(true);
      setShowSplash(false);
    });

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
    if (Capacitor.isNativePlatform()) {
      appStateManager.clearSplashMarker();
      appStateManager.updateActivity();
    }
    setShowSplash(false);
  };

  // Fallback timeout to ensure app loads even if there are issues
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!appReady) {
        console.warn('App taking too long to initialize, forcing ready state');
        setAppReady(true);
        setShowSplash(false);
      }
    }, 5000); // 5 second fallback

    return () => clearTimeout(fallbackTimer);
  }, [appReady]);

  // Don't render anything until app is ready (but provide loading fallback)
  if (!appReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-600">
        <div className="text-white text-lg animate-pulse">Loading WiFi Voucher App...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {showSplash && Capacitor.isNativePlatform() ? (
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
