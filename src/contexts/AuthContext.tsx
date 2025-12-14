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

// Simple in-memory cache
const userCache = new Map<string, { user: AuthUser; roles: AppRole[]; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);
  const initDoneRef = useRef(false);

  // Fast user data loader with cache
  const loadUserData = useCallback(async (userId: string, email: string): Promise<{ user: AuthUser; roles: AppRole[] } | null> => {
    const cached = userCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { user: cached.user, roles: cached.roles };
    }

    try {
      const [profileResult, rolesResult] = await Promise.all([
        supabase.from('user_profiles').select('full_name, user_type, phone_number, location').eq('user_id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId)
      ]);

      const profile = profileResult.data;
      const userRoles = (rolesResult.data?.map(r => r.role as AppRole) || []) as AppRole[];

      const authUser: AuthUser = {
        id: userId,
        email: email,
        name: profile?.full_name || email.split('@')[0],
        user_type: (profile?.user_type as 'citizen' | 'contractor' | 'government') || 'citizen',
        profile: profile ? { full_name: profile.full_name, phone_number: profile.phone_number, location: profile.location } : undefined
      };

      userCache.set(userId, { user: authUser, roles: userRoles, timestamp: Date.now() });
      return { user: authUser, roles: userRoles };
    } catch {
      return null;
    }
  }, []);

  const refreshRoles = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
    if (mountedRef.current && data) {
      const newRoles = data.map(r => r.role as AppRole);
      setRoles(newRoles);
      const cached = userCache.get(user.id);
      if (cached) userCache.set(user.id, { ...cached, roles: newRoles, timestamp: Date.now() });
    }
  }, [user?.id]);

  const hasRole = useCallback((role: AppRole): boolean => roles.includes(role), [roles]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) return { user: null, error };
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
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: { user_type: userData.type, full_name: userData.name }
        }
      });
      return { error: error || null };
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (user?.id) userCache.delete(user.id);
    await supabase.auth.signOut();
    if (mountedRef.current) {
      setUser(null);
      setRoles([]);
    }
  }, [user?.id]);

  useEffect(() => {
    mountedRef.current = true;

    // Quick init - get session synchronously if possible
    const init = async () => {
      if (initDoneRef.current) return;
      initDoneRef.current = true;

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user && mountedRef.current) {
        const userData = await loadUserData(session.user.id, session.user.email || '');
        if (mountedRef.current && userData) {
          setUser(userData.user);
          setRoles(userData.roles);
        }
      }
      
      if (mountedRef.current) setLoading(false);
    };

    init();

    // Listen for auth changes (sign in/out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mountedRef.current || event === 'INITIAL_SESSION') return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setRoles([]);
        setLoading(false);
      } else if (event === 'SIGNED_IN' && session?.user) {
        // Defer to avoid deadlock
        setTimeout(async () => {
          const userData = await loadUserData(session.user.id, session.user.email || '');
          if (mountedRef.current && userData) {
            setUser(userData.user);
            setRoles(userData.roles);
          }
          if (mountedRef.current) setLoading(false);
        }, 0);
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const value = useMemo<EnhancedAuthContextType>(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    roles,
    hasRole,
    refreshRoles,
  }), [user, loading, signIn, signUp, signOut, roles, hasRole, refreshRoles]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
