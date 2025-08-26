import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { appStateManager } from '@/utils/appStateManager';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export default function SplashScreen({ onComplete, duration = 3000 }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeClass, setFadeClass] = useState('opacity-0');
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    // Prevent duplicate splash screen completion
    if (hasCompleted) {
      return;
    }

    console.log('Splash screen starting...');
    
    // Mark splash screen start in state manager
    appStateManager.markSplashStart();
    
    // Start fade-in animation immediately
    const fadeInTimer = setTimeout(() => {
      setFadeClass('opacity-100');
    }, 100);

    // Start fade-out animation before completion
    const fadeOutTimer = setTimeout(() => {
      setFadeClass('opacity-0');
    }, duration - 500);

    // Complete splash screen
    const completeTimer = setTimeout(() => {
      console.log('Splash screen completing...');
      setHasCompleted(true);
      setIsVisible(false);
      appStateManager.clearSplashMarker();
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete, duration, hasCompleted]);

  // Force complete splash screen if app is resuming
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && !hasCompleted) {
          console.log('App became visible, ensuring splash completion');
          // Ensure splash screen completes when app becomes visible
          setTimeout(() => {
            if (!hasCompleted) {
              console.log('Force completing splash screen');
              setHasCompleted(true);
              setIsVisible(false);
              appStateManager.clearSplashMarker();
              onComplete();
            }
          }, 1000); // Give splash screen 1 second to complete naturally
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [onComplete, hasCompleted]);

  if (!isVisible || hasCompleted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5"></div>
      </div>

      {/* Main Content */}
      <div className={`flex flex-col items-center justify-center text-center transition-all duration-1000 ease-in-out transform ${fadeClass} ${fadeClass === 'opacity-100' ? 'scale-100' : 'scale-95'}`}>
        {/* LSM Logo */}
        <div className="relative mb-8">
          {/* Logo Background Circle */}
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-2xl">
            {/* LSM Text Logo */}
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wider">
                LSM
              </h1>
              <div className="w-12 h-0.5 bg-white/80 mx-auto mt-2"></div>
            </div>
          </div>
          
          {/* Decorative Rings */}
          <div className="absolute inset-0 rounded-full border border-white/20 animate-ping"></div>
          <div className="absolute inset-0 rounded-full border border-white/10 animate-pulse"></div>
        </div>

        {/* Company Name and App Title */}
        <div className="space-y-2">
          <h2 className="text-xl md:text-2xl font-semibold text-white/90 tracking-wide">
            LSM Company
          </h2>
          <p className="text-sm md:text-base text-white/70 font-light tracking-wide">
            Aplikasi Pencatat Penjualan LSM
          </p>
        </div>

        {/* Loading Indicator */}
        <div className="mt-8 flex items-center space-x-2">
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-900/50 to-transparent"></div>
    </div>
  );
}