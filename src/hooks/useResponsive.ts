
import { useState, useEffect } from 'react';

interface BreakpointState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLarge: boolean;
  screenWidth: number;
}

export const useResponsive = (): BreakpointState => {
  const [state, setState] = useState<BreakpointState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLarge: false,
    screenWidth: 0,
  });

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      setState({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024 && width < 1280,
        isLarge: width >= 1280,
        screenWidth: width,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return state;
};
