import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mgx.wifivoucher',
  appName: 'WiFi Voucher Management',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    minWebViewVersion: 60,
    allowMixedContent: true,
    useLegacyBridge: false,
    appendUserAgent: 'WiFiVoucherApp/1.0.0'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#3b82f6',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#3b82f6'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    },
    App: {
      launchUrl: '/'
    },
    Filesystem: {
      iosLimitedPhotosPermission: true,
      androidRequestPermissions: true
    }
  }
};

export default config;
