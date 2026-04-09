import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // Warn 2 minutes before

/**
 * Auto-logs out users after 30 minutes of inactivity.
 * Monitors mouse, keyboard, touch, and scroll events.
 */
export const useIdleTimeout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasWarnedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimers();
    toast.error('You have been logged out due to inactivity.', { duration: 6000 });
    try {
      await signOut();
    } catch {
      // ignore
    }
    navigate('/auth', { replace: true });
  }, [signOut, navigate, clearTimers]);

  const resetTimer = useCallback(() => {
    if (!user) return;
    clearTimers();
    hasWarnedRef.current = false;

    warningRef.current = setTimeout(() => {
      if (!hasWarnedRef.current) {
        hasWarnedRef.current = true;
        toast.warning('Your session will expire in 2 minutes due to inactivity.', {
          duration: 10000,
          action: {
            label: 'Stay Logged In',
            onClick: () => resetTimer(),
          },
        });
      }
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS);

    timeoutRef.current = setTimeout(handleLogout, IDLE_TIMEOUT_MS);
  }, [user, handleLogout, clearTimers]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'] as const;
    
    // Throttle to avoid excessive resets
    let lastReset = Date.now();
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastReset > 30000) { // Only reset every 30s
        lastReset = now;
        resetTimer();
      }
    };

    events.forEach(event => document.addEventListener(event, throttledReset, { passive: true }));
    resetTimer();

    return () => {
      clearTimers();
      events.forEach(event => document.removeEventListener(event, throttledReset));
    };
  }, [user, resetTimer, clearTimers]);
};
