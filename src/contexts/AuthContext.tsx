import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AuthUser, AuthContextType } from '@/types/auth';
import type { AppRole } from '@/services/RoleService';

interface EnhancedAuthContextType extends AuthContextType {
  roles: AppRole[];
  hasRole: (role: AppRole) => boolean;
  refreshRoles: () => Promise<void>;
}

const AuthContext = createContext<EnhancedAuthContextType | undefined>(undefined);

// Cache for user data to prevent refetching
const userCache = new Map<string, { user: AuthUser; roles: AppRole[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);
  const initCompletedRef = useRef(false);

  // Fast parallel data loading
  const loadUserData = useCallback(async (userId: string, email: string): Promise<{ user: AuthUser; roles: AppRole[] } | null> => {
    // Check cache first
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { user: cached.user, roles: cached.roles };
    }

    try {
      // Load profile and roles in parallel
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('full_name, user_type, phone_number, location')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
      ]);

      const profile = profileResult.data;
      const userRoles = (rolesResult.data?.map(r => r.role as AppRole) || []) as AppRole[];

      const authUser: AuthUser = {
        id: userId,
        email: email,
        name: profile?.full_name || email.split('@')[0],
        user_type: (profile?.user_type as 'citizen' | 'contractor' | 'government') || 'citizen',
        profile: profile ? {
          full_name: profile.full_name,
          phone_number: profile.phone_number,
          location: profile.location
        } : undefined
      };

      // Update cache
      userCache.set(userId, { user: authUser, roles: userRoles, timestamp: Date.now() });

      return { user: authUser, roles: userRoles };
    } catch (error) {
      console.error('Error loading user data:', error);
      return null;
    }
  }, []);

  const refreshRoles = useCallback(async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);
    
    if (mountedRef.current && data) {
      const newRoles = data.map(r => r.role as AppRole);
      setRoles(newRoles);
      
      // Update cache
      const cached = userCache.get(user.id);
      if (cached) {
        userCache.set(user.id, { ...cached, roles: newRoles, timestamp: Date.now() });
      }
    }
  }, [user?.id]);

  const hasRole = useCallback((role: AppRole): boolean => {
    return roles.includes(role);
  }, [roles]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim().toLowerCase(), 
        password 
      });
      
      if (error) {
        return { user: null, error };
      }

      if (data.user && data.session) {
        const userData = await loadUserData(data.user.id, data.user.email || '');
        if (mountedRef.current && userData) {
          setUser(userData.user);
          setRoles(userData.roles);
        }
        return { user: userData?.user || null, error: null };
      }

      return { user: null, error: new Error('Login failed') };
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [loadUserData]);

  const signUp = useCallback(async (email: string, password: string, userData: { name: string; type: 'citizen' | 'contractor' | 'government' }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email: email.trim().toLowerCase(), 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            user_type: userData.type,
            full_name: userData.name
          }
        }
      });
      
      if (error) {
        return { error };
      }
      
      return { error: null };
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      // Clear cache for current user
      if (user?.id) {
        userCache.delete(user.id);
      }
      await supabase.auth.signOut();
      if (mountedRef.current) {
        setUser(null);
        setRoles([]);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    mountedRef.current = true;

    const initSession = async () => {
      if (initCompletedRef.current) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && mountedRef.current) {
          const userData = await loadUserData(session.user.id, session.user.email || '');
          if (mountedRef.current && userData) {
            setUser(userData.user);
            setRoles(userData.roles);
          }
        }
      } finally {
        if (mountedRef.current) {
          setInitializing(false);
          initCompletedRef.current = true;
        }
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return;

        // Skip if still initializing (we handle initial session above)
        if (!initCompletedRef.current && event === 'INITIAL_SESSION') return;

        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setRoles([]);
        } else if (event === 'SIGNED_IN' && session?.user) {
          const userData = await loadUserData(session.user.id, session.user.email || '');
          if (mountedRef.current && userData) {
            setUser(userData.user);
            setRoles(userData.roles);
          }
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const value = useMemo<EnhancedAuthContextType>(() => ({
    user,
    loading: loading || initializing,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    roles,
    hasRole,
    refreshRoles,
  }), [user, loading, initializing, signIn, signUp, signOut, roles, hasRole, refreshRoles]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
