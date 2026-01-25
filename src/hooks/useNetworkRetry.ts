import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onMaxRetriesReached?: (error: Error) => void;
}

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
}

/**
 * Hook for handling network requests with automatic retry and exponential backoff
 */
export function useNetworkRetry<T>(
  fetchFn: () => Promise<T>,
  config: RetryConfig = {}
) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
    onMaxRetriesReached,
  } = config;

  const [state, setState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
  });
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const calculateDelay = useCallback((attempt: number): number => {
    const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
    return Math.min(delay, maxDelay);
  }, [baseDelay, backoffMultiplier, maxDelay]);

  const execute = useCallback(async (): Promise<T | null> => {
    setIsLoading(true);
    setState({ isRetrying: false, retryCount: 0, lastError: null });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (!mountedRef.current) return null;

      try {
        const result = await fetchFn();
        if (mountedRef.current) {
          setData(result);
          setIsLoading(false);
          setState({ isRetrying: false, retryCount: attempt, lastError: null });
        }
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (!mountedRef.current) return null;

        if (attempt < maxRetries) {
          const delay = calculateDelay(attempt);
          setState({ isRetrying: true, retryCount: attempt + 1, lastError });
          onRetry?.(attempt + 1, lastError);
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Max retries reached
    if (mountedRef.current) {
      setState({ isRetrying: false, retryCount: maxRetries, lastError });
      setIsLoading(false);
      onMaxRetriesReached?.(lastError!);
      toast.error('Network error', {
        description: 'Failed to complete request after multiple attempts. Please check your connection.',
      });
    }

    return null;
  }, [fetchFn, maxRetries, calculateDelay, onRetry, onMaxRetriesReached]);

  const reset = useCallback(() => {
    setState({ isRetrying: false, retryCount: 0, lastError: null });
    setData(null);
    setIsLoading(false);
  }, []);

  return {
    execute,
    reset,
    data,
    isLoading,
    isRetrying: state.isRetrying,
    retryCount: state.retryCount,
    lastError: state.lastError,
    hasError: state.lastError !== null,
  };
}

/**
 * Wrapper for preventing duplicate form submissions
 */
export function usePreventDuplicateSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const withSubmitGuard = useCallback(async <T>(
    fn: () => Promise<T>
  ): Promise<T | null> => {
    if (submittingRef.current) {
      toast.warning('Please wait', {
        description: 'Your previous request is still processing.',
      });
      return null;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const result = await fn();
      return result;
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }, []);

  return { isSubmitting, withSubmitGuard };
}