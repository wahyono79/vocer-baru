import { createRoot } from 'react-dom/client';
import DebugApp from './App.debug.tsx';
import './index.css';

// Error handling for debugging
window.addEventListener('error', (e) => {
  console.error('❌ Global Error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('❌ Unhandled Promise Rejection:', e.reason);
});

console.log('🚀 Starting WiFi Voucher Management App...');

// Service worker temporarily disabled for debugging
/*
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
*/

// Handle install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Save the event for later use
  (window as any).deferredPrompt = e;
  console.log('💾 Install prompt ready');
});

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found!');
  }
  
  console.log('🎯 Creating React root...');
  const root = createRoot(rootElement);
  
  console.log('🎨 Rendering App component...');
  root.render(<DebugApp />);
  
  console.log('✅ App rendered successfully!');
} catch (error) {
  console.error('❌ Failed to initialize app:', error);
  // Fallback: show error message
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial; text-align: center;">
      <h1>⚠️ App Failed to Load</h1>
      <p>Error: ${error}</p>
      <p>Please check the console for more details.</p>
      <button onclick="location.reload()">🔄 Reload Page</button>
    </div>
  `;
}
