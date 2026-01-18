
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useViewport } from './useViewport';

interface AdaptiveLayoutConfig {
  // Content density levels
  contentDensity: 'compact' | 'comfortable' | 'spacious';
  // Grid columns for different content types
  gridCols: {
    cards: number;
    stats: number;
    actions: number;
    list: number;
  };
  // Spacing scale
  spacing: {
    section: string;
    card: string;
    element: string;
  };
  // Typography scale
  typography: {
    heading: string;
    subheading: string;
    body: string;
    caption: string;
  };
  // Touch target sizes
  touchTarget: {
    button: string;
    icon: string;
    interactive: string;
  };
  // Content visibility
  showSecondaryContent: boolean;
  showDetailedInfo: boolean;
  useCompactCards: boolean;
  // Layout preferences
  preferStackedLayout: boolean;
  maxContentWidth: string;
}

export const useAdaptiveLayout = (): AdaptiveLayoutConfig => {
  const { width, isMobile, isTablet, isDesktop } = useViewport();
  
  const config = useMemo((): AdaptiveLayoutConfig => {
    // Mobile (< 768px)
    if (isMobile) {
      return {
        contentDensity: 'compact',
        gridCols: {
          cards: 1,
          stats: 2,
          actions: 2,
          list: 1
        },
        spacing: {
          section: 'py-4 space-y-4',
          card: 'p-3 gap-3',
          element: 'gap-2 space-y-2'
        },
        typography: {
          heading: 'text-xl font-bold',
          subheading: 'text-base font-semibold',
          body: 'text-sm',
          caption: 'text-xs'
        },
        touchTarget: {
          button: 'min-h-[44px] px-4',
          icon: 'h-10 w-10',
          interactive: 'min-h-[44px] min-w-[44px]'
        },
        showSecondaryContent: false,
        showDetailedInfo: false,
        useCompactCards: true,
        preferStackedLayout: true,
        maxContentWidth: 'max-w-full'
      };
    }
    
    // Tablet (768px - 1023px)
    if (isTablet) {
      return {
        contentDensity: 'comfortable',
        gridCols: {
          cards: 2,
          stats: 2,
          actions: 3,
          list: 1
        },
        spacing: {
          section: 'py-6 space-y-5',
          card: 'p-4 gap-4',
          element: 'gap-3 space-y-3'
        },
        typography: {
          heading: 'text-2xl font-bold',
          subheading: 'text-lg font-semibold',
          body: 'text-sm',
          caption: 'text-xs'
        },
        touchTarget: {
          button: 'min-h-[40px] px-4',
          icon: 'h-9 w-9',
          interactive: 'min-h-[40px] min-w-[40px]'
        },
        showSecondaryContent: true,
        showDetailedInfo: false,
        useCompactCards: false,
        preferStackedLayout: false,
        maxContentWidth: 'max-w-4xl'
      };
    }
    
    // Desktop (>= 1024px)
    return {
      contentDensity: 'spacious',
      gridCols: {
        cards: 3,
        stats: 4,
        actions: 4,
        list: 1
      },
      spacing: {
        section: 'py-8 space-y-6',
        card: 'p-6 gap-6',
        element: 'gap-4 space-y-4'
        },
      typography: {
        heading: 'text-3xl font-bold',
        subheading: 'text-xl font-semibold',
        body: 'text-base',
        caption: 'text-sm'
      },
      touchTarget: {
        button: 'min-h-[36px] px-6',
        icon: 'h-8 w-8',
        interactive: 'min-h-[36px] min-w-[36px]'
      },
      showSecondaryContent: true,
      showDetailedInfo: true,
      useCompactCards: false,
      preferStackedLayout: false,
      maxContentWidth: 'max-w-7xl'
    };
  }, [isMobile, isTablet, isDesktop, width]);
  
  return config;
};

// Hook for adaptive grid classes
export const useAdaptiveGrid = (type: 'cards' | 'stats' | 'actions' | 'list' = 'cards') => {
  const { gridCols } = useAdaptiveLayout();
  const { isMobile, isTablet } = useViewport();
  
  const gridClass = useMemo(() => {
    const cols = gridCols[type];
    
    if (isMobile) {
      if (type === 'stats') return 'grid-cols-2';
      if (type === 'actions') return 'grid-cols-2';
      return 'grid-cols-1';
    }
    
    if (isTablet) {
      if (type === 'cards') return 'grid-cols-2';
      if (type === 'stats') return 'grid-cols-2 md:grid-cols-4';
      if (type === 'actions') return 'grid-cols-2 md:grid-cols-3';
      return 'grid-cols-1';
    }
    
    // Desktop
    if (type === 'cards') return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    if (type === 'stats') return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6';
    if (type === 'actions') return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
    return 'grid-cols-1';
  }, [gridCols, type, isMobile, isTablet]);
  
  return gridClass;
};

// Hook for content prioritization
export const useContentPriority = () => {
  const { showSecondaryContent, showDetailedInfo, useCompactCards } = useAdaptiveLayout();
  const { isMobile, isTablet } = useViewport();
  
  const shouldShow = useCallback((priority: 'primary' | 'secondary' | 'tertiary') => {
    if (priority === 'primary') return true;
    if (priority === 'secondary') return showSecondaryContent;
    return showDetailedInfo;
  }, [showSecondaryContent, showDetailedInfo]);
  
  const truncateText = useCallback((text: string, priority: 'primary' | 'secondary' = 'primary') => {
    if (!text) return '';
    
    const maxLength = isMobile 
      ? (priority === 'primary' ? 60 : 40)
      : isTablet
        ? (priority === 'primary' ? 100 : 60)
        : 200;
    
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  }, [isMobile, isTablet]);
  
  return {
    shouldShow,
    truncateText,
    showSecondaryContent,
    showDetailedInfo,
    useCompactCards
  };
};
