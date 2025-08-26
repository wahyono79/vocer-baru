import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Render the app first
createRoot(document.getElementById('root')!).render(<App />);

// Initialize service worker after app is loaded (non-blocking)
if ('serviceWorker' in navigator) {
  // Defer service worker initialization to avoid blocking app startup
  setTimeout(() => {
    import('./lib/serviceWorker').then(({ serviceWorkerManager }) => {
      console.log('🔧 Service Worker Manager initialized (deferred)');
    }).catch(error => {
      console.warn('⚠️ Service Worker initialization failed:', error);
      // Don't block app if SW fails
    });
  }, 2000); // Initialize after 2 seconds
}

// Handle install prompt (non-blocking)
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Save the event for later use
  (window as any).deferredPrompt = e;
  console.log('💾 Install prompt ready');
});
