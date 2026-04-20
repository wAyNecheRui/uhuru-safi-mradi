
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

console.log('Main.tsx starting...');

const isPreviewHost = () => {
  if (typeof window === 'undefined') return false;
  return /lovable(app|project)\.com$/.test(window.location.hostname) || window.location.hostname.endsWith('.lovable.app');
};

const clearPreviewCaches = async () => {
  if (typeof window === 'undefined' || !isPreviewHost()) return;

  try {
    let didClearRuntimeState = false;

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      didClearRuntimeState = didClearRuntimeState || registrations.length > 0;
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }

    if ('caches' in window) {
      const cacheNames = await caches.keys();
      didClearRuntimeState = didClearRuntimeState || cacheNames.length > 0;
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }

    console.log('[PWA] Cleared service workers and caches for preview host');

    if (didClearRuntimeState && !window.sessionStorage.getItem('preview-cache-reset')) {
      window.sessionStorage.setItem('preview-cache-reset', 'true');
      window.location.reload();
    }
  } catch (error) {
    console.warn('[PWA] Failed to clear preview caches', error);
  }
};

if (isPreviewHost()) {
  clearPreviewCaches().catch(console.error);
}

// Initialize Capacitor plugins with error handling
const initializeApp = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
      console.log('Initializing native platform...');
      // Hide splash screen after app is ready
      await SplashScreen.hide();
      
      // Configure status bar
      await StatusBar.setStyle({ style: Style.Dark });
      
      console.log('Native platform initialized');
    } else {
      console.log('Running on web platform');
    }
  } catch (error) {
    console.warn('Capacitor initialization error:', error);
    // Continue with web initialization even if native features fail
  }
};

// Initialize the app
initializeApp().catch(console.error);

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
  throw new Error('Root element not found');
}

console.log('Root element found, starting React app...');

try {
  createRoot(rootElement).render(
    <StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </StrictMode>,
  );
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Error rendering React app:', error);
}
