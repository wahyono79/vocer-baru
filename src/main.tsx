import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize service worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Import service worker manager to initialize it
    import('./lib/serviceWorker').then(({ serviceWorkerManager }) => {
      console.log('🔧 Service Worker Manager initialized');
    }).catch(error => {
      console.error('❌ Failed to initialize Service Worker:', error);
    });
  });
}

// Handle install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Save the event for later use
  (window as any).deferredPrompt = e;
  console.log('💾 Install prompt ready');
});

createRoot(document.getElementById('root')!).render(<App />);
