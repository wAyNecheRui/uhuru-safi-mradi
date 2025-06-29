
import { useState, useEffect, useCallback } from 'react';

interface AccessibilityState {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  reduceMotion: boolean;
  screenReader: boolean;
}

export const useAccessibility = () => {
  const [accessibility, setAccessibility] = useState<AccessibilityState>({
    highContrast: false,
    fontSize: 'medium',
    reduceMotion: false,
    screenReader: false
  });

  useEffect(() => {
    // Check for system preferences
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    
    // Load saved preferences
    const savedPrefs = localStorage.getItem('accessibility-preferences');
    if (savedPrefs) {
      const parsed = JSON.parse(savedPrefs);
      setAccessibility(prev => ({ ...prev, ...parsed }));
    } else {
      setAccessibility(prev => ({
        ...prev,
        reduceMotion: prefersReducedMotion,
        highContrast: prefersHighContrast
      }));
    }

    // Detect screen reader
    const isScreenReader = navigator.userAgent.includes('NVDA') || 
                          navigator.userAgent.includes('JAWS') || 
                          'speechSynthesis' in window;
    
    setAccessibility(prev => ({ ...prev, screenReader: isScreenReader }));
  }, []);

  const updateAccessibility = useCallback((updates: Partial<AccessibilityState>) => {
    setAccessibility(prev => {
      const newState = { ...prev, ...updates };
      localStorage.setItem('accessibility-preferences', JSON.stringify(newState));
      return newState;
    });
  }, []);

  const toggleHighContrast = useCallback(() => {
    updateAccessibility({ highContrast: !accessibility.highContrast });
  }, [accessibility.highContrast, updateAccessibility]);

  const setFontSize = useCallback((size: AccessibilityState['fontSize']) => {
    updateAccessibility({ fontSize: size });
  }, [updateAccessibility]);

  const toggleReduceMotion = useCallback(() => {
    updateAccessibility({ reduceMotion: !accessibility.reduceMotion });
  }, [accessibility.reduceMotion, updateAccessibility]);

  return {
    accessibility,
    toggleHighContrast,
    setFontSize,
    toggleReduceMotion,
    updateAccessibility
  };
};

// Hook for keyboard navigation
export const useKeyboardNavigation = () => {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return { isKeyboardUser };
};
