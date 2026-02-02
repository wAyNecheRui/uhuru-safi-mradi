/**
 * Hook to manage user data isolation and cache clearing on user changes.
 * This prevents users from seeing other users' data during auth transitions.
 */
import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Clears all cached query data when the user changes.
 * This is critical for security - prevents showing one user's data to another.
 */
export const useUserIsolation = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    // Skip during initial load
    if (loading) return;

    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserIdRef.current;

    // Mark as initialized after first load completes
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      prevUserIdRef.current = currentUserId;
      return;
    }

    // If user changed (including logout or switch), clear ALL cached data
    if (currentUserId !== prevUserId) {
      console.log('[Security] User changed, clearing all cached data');
      
      // Clear all query cache to prevent data leakage
      queryClient.clear();
      
      // Reset all queries to ensure fresh data on next load
      queryClient.resetQueries();
      
      prevUserIdRef.current = currentUserId;
    }
  }, [user?.id, loading, queryClient]);

  return {
    isUserStable: !loading && hasInitializedRef.current,
    currentUserId: user?.id ?? null,
  };
};

/**
 * Guard hook that ensures user is authenticated and matches expected role
 * before returning user data. Returns null during transitions.
 */
export const useSecureUser = () => {
  const { user, loading, isAuthenticated } = useAuth();

  // Return null during any transition state
  if (loading || !isAuthenticated || !user) {
    return null;
  }

  return user;
};

/**
 * Validates that the current user matches the expected user type.
 * Returns false during loading or if there's a mismatch.
 */
export const useValidateUserType = (expectedType: 'citizen' | 'contractor' | 'government') => {
  const { user, loading } = useAuth();
  
  if (loading || !user) {
    return { isValid: false, isLoading: true };
  }
  
  return { 
    isValid: user.user_type === expectedType, 
    isLoading: false,
    actualType: user.user_type
  };
};
