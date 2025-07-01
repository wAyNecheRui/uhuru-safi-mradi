
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

console.log('Main.tsx starting...');

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
