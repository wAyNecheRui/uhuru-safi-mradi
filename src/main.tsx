
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

// Initialize Capacitor plugins with error handling
const initializeApp = async () => {
  try {
    if (Capacitor.isNativePlatform()) {
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
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
