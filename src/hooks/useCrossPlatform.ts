import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { useNativeFeatures } from './useNativeFeatures';

export interface CrossPlatformState {
  platform: 'web' | 'ios' | 'android';
  isNative: boolean;
  isPWA: boolean;
  isOnline: boolean;
  canInstall: boolean;
  isStandalone: boolean;
  supportsNotifications: boolean;
  supportsCamera: boolean;
  supportsGeolocation: boolean;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const useCrossPlatform = () => {
  const nativeFeatures = useNativeFeatures();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPWA, setIsPWA] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const checkPWA = () => {
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (window.navigator as any).standalone === true;
      setIsStandalone(isInStandaloneMode || isIosStandalone);
      setIsPWA(isInStandaloneMode || isIosStandalone);
    };

    checkPWA();

    // Listen for beforeinstallprompt event (PWA install)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setCanInstall(false);
      setDeferredPrompt(null);
      setIsPWA(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const getPlatform = useCallback((): 'web' | 'ios' | 'android' => {
    if (Capacitor.isNativePlatform()) {
      return Capacitor.getPlatform() as 'ios' | 'android';
    }
    return 'web';
  }, []);

  const installPWA = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanInstall(false);
        return true;
      }
      return false;
    } catch (error) {
      console.error('PWA install error:', error);
      return false;
    }
  }, [deferredPrompt]);

  const checkNotificationSupport = useCallback((): boolean => {
    if (Capacitor.isNativePlatform()) {
      return true; // Native always supports
    }
    return 'Notification' in window;
  }, []);

  const checkCameraSupport = useCallback((): boolean => {
    if (Capacitor.isNativePlatform()) {
      return true;
    }
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  const checkGeolocationSupport = useCallback((): boolean => {
    return 'geolocation' in navigator;
  }, []);

  const state: CrossPlatformState = {
    platform: getPlatform(),
    isNative: nativeFeatures.isNative,
    isPWA,
    isOnline: nativeFeatures.isOnline,
    canInstall,
    isStandalone,
    supportsNotifications: checkNotificationSupport(),
    supportsCamera: checkCameraSupport(),
    supportsGeolocation: checkGeolocationSupport(),
  };

  return {
    ...state,
    ...nativeFeatures,
    installPWA,
  };
};
