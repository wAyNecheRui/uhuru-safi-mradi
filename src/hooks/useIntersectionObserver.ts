
import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export const useIntersectionObserver = (
  options: UseIntersectionObserverOptions = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const { freezeOnceVisible = false, ...observerOptions } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        
        setIsIntersecting(isElementIntersecting);

        if (isElementIntersecting) {
          setHasBeenVisible(true);
          
          if (freezeOnceVisible) {
            observer.disconnect();
          }
        }
      },
      {
        threshold: 0.1,
        ...observerOptions
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [freezeOnceVisible, observerOptions]);

  return {
    elementRef,
    isIntersecting,
    hasBeenVisible
  };
};

// Hook for triggering animations when elements come into view
export const useScrollAnimation = (
  animationClass: string = 'animate-fade-in',
  options: UseIntersectionObserverOptions = {}
) => {
  const { elementRef, isIntersecting, hasBeenVisible } = useIntersectionObserver({
    freezeOnceVisible: true,
    ...options
  });

  const className = hasBeenVisible ? animationClass : 'opacity-0';

  return {
    ref: elementRef,
    className,
    isVisible: hasBeenVisible
  };
};

// Hook for lazy loading content
export const useLazyLoad = <T>(
  loadFunction: () => Promise<T>,
  options: UseIntersectionObserverOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { elementRef, isIntersecting } = useIntersectionObserver(options);

  useEffect(() => {
    if (isIntersecting && !data && !loading) {
      setLoading(true);
      setError(null);
      
      loadFunction()
        .then(setData)
        .catch(setError)
        .finally(() => setLoading(false));
    }
  }, [isIntersecting, data, loading, loadFunction]);

  return {
    ref: elementRef,
    data,
    loading,
    error
  };
};
