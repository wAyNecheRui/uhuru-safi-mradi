import { useEffect, useRef, useCallback } from 'react';

interface FocusManagerOptions {
  autoFocus?: boolean;
  restoreFocus?: boolean;
  trapFocus?: boolean;
}

/**
 * Hook for managing focus within a container (dialogs, modals, sheets)
 */
export function useFocusManager(
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean,
  options: FocusManagerOptions = {}
) {
  const { autoFocus = true, restoreFocus = true, trapFocus = true } = options;
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element when activating
  useEffect(() => {
    if (isActive && restoreFocus) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [isActive, restoreFocus]);

  // Auto-focus first focusable element
  useEffect(() => {
    if (!isActive || !autoFocus || !containerRef.current) return;

    const focusableElements = getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        focusableElements[0].focus();
      });
    }
  }, [isActive, autoFocus, containerRef]);

  // Restore focus when deactivating
  useEffect(() => {
    return () => {
      if (restoreFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [restoreFocus]);

  // Trap focus within container
  useEffect(() => {
    if (!isActive || !trapFocus || !containerRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !containerRef.current) return;

      const focusableElements = getFocusableElements(containerRef.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, trapFocus, containerRef]);
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ');

  return Array.from(container.querySelectorAll<HTMLElement>(selector));
}

/**
 * Hook for skip link functionality
 */
export function useSkipLink() {
  const mainRef = useRef<HTMLElement>(null);

  const skipToMain = useCallback(() => {
    if (mainRef.current) {
      mainRef.current.focus();
      mainRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return { mainRef, skipToMain };
}

/**
 * Hook for keyboard navigation in lists
 */
export function useKeyboardNavigation<T extends HTMLElement>(
  items: React.RefObject<T>[],
  options: { wrap?: boolean; horizontal?: boolean } = {}
) {
  const { wrap = true, horizontal = false } = options;
  const currentIndex = useRef(0);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const prevKey = horizontal ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = horizontal ? 'ArrowRight' : 'ArrowDown';

    if (e.key === nextKey) {
      e.preventDefault();
      const nextIndex = currentIndex.current + 1;
      if (nextIndex < items.length) {
        currentIndex.current = nextIndex;
        items[nextIndex].current?.focus();
      } else if (wrap) {
        currentIndex.current = 0;
        items[0].current?.focus();
      }
    } else if (e.key === prevKey) {
      e.preventDefault();
      const prevIndex = currentIndex.current - 1;
      if (prevIndex >= 0) {
        currentIndex.current = prevIndex;
        items[prevIndex].current?.focus();
      } else if (wrap) {
        currentIndex.current = items.length - 1;
        items[items.length - 1].current?.focus();
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      currentIndex.current = 0;
      items[0].current?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      currentIndex.current = items.length - 1;
      items[items.length - 1].current?.focus();
    }
  }, [items, wrap, horizontal]);

  return { handleKeyDown, currentIndex };
}

/**
 * Hook for live region announcements
 */
export function useLiveAnnouncer() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.getElementById('live-announcer') || createAnnouncer();
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }, []);

  return { announce };
}

function createAnnouncer(): HTMLElement {
  const announcer = document.createElement('div');
  announcer.id = 'live-announcer';
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.style.cssText = 'position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0);';
  document.body.appendChild(announcer);
  return announcer;
}