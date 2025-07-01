
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar } from '@capacitor/status-bar';

// Initialize Capacitor plugins
const initializeApp = async () => {
  if (Capacitor.isNativePlatform()) {
    // Hide splash screen after app is ready
    await SplashScreen.hide();
    
    // Configure status bar
    await StatusBar.setStyle({ style: 'DARK' });
    
    console.log('Native platform initialized');
  } else {
    console.log('Running on web platform');
  }
};

// Initialize the app
initializeApp();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
