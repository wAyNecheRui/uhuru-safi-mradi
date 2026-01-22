import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';
import { RealtimeEventService } from '@/services/RealtimeEventService';

interface RealtimeContextType {
  isConnected: boolean;
  lastUpdate: Date | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  triggerRefresh: (tables: string[]) => void;
  subscribeToRefresh: (callback: (tables: string[]) => void) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

interface RealtimeProviderProps {
  children: ReactNode;
}

/**
 * RealtimeProvider - Global provider for real-time updates across the application
 * Maintains a central connection and broadcasts updates to subscribed components
 */
export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  // Subscribers who want to be notified when data changes
  const subscribersRef = useRef<Set<(tables: string[]) => void>>(new Set());
  const channelRef = useRef<RealtimeChannel | null>(null);
  const eventCleanupRef = useRef<(() => void) | null>(null);

  // Subscribe components to refresh notifications
  const subscribeToRefresh = useCallback((callback: (tables: string[]) => void) => {
    subscribersRef.current.add(callback);
    return () => {
      subscribersRef.current.delete(callback);
    };
  }, []);

  // Trigger refresh for specific tables
  const triggerRefresh = useCallback((tables: string[]) => {
    setLastUpdate(new Date());
    subscribersRef.current.forEach(callback => callback(tables));
  }, []);

  // Notify subscribers when database changes occur
  const notifySubscribers = useCallback((table: string) => {
    triggerRefresh([table]);
  }, [triggerRefresh]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setConnectionStatus('disconnected');
      setIsConnected(false);
      return;
    }

    setConnectionStatus('connecting');

    // Create a global channel for all critical tables
    const channelName = `global-realtime-${user.id}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      // Problem reports - for status changes, new reports
      .on('postgres_changes', { event: '*', schema: 'public', table: 'problem_reports' }, (payload) => {
        console.log('[Global Realtime] problem_reports change:', payload.eventType);
        notifySubscribers('problem_reports');
      })
      // Projects - for project status changes
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, (payload) => {
        console.log('[Global Realtime] projects change:', payload.eventType);
        notifySubscribers('projects');
      })
      // Contractor bids - for bid submissions and selections
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contractor_bids' }, (payload) => {
        console.log('[Global Realtime] contractor_bids change:', payload.eventType);
        notifySubscribers('contractor_bids');
      })
      // Milestones - for progress updates
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_milestones' }, (payload) => {
        console.log('[Global Realtime] project_milestones change:', payload.eventType);
        notifySubscribers('project_milestones');
      })
      // Escrow - for funding updates
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escrow_accounts' }, (payload) => {
        console.log('[Global Realtime] escrow_accounts change:', payload.eventType);
        notifySubscribers('escrow_accounts');
      })
      // Payments - for payment releases
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_transactions' }, (payload) => {
        console.log('[Global Realtime] payment_transactions change:', payload.eventType);
        notifySubscribers('payment_transactions');
      })
      // Milestone verifications - for citizen verifications
      .on('postgres_changes', { event: '*', schema: 'public', table: 'milestone_verifications' }, (payload) => {
        console.log('[Global Realtime] milestone_verifications change:', payload.eventType);
        notifySubscribers('milestone_verifications');
      })
      // Community votes - for vote updates
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_votes' }, (payload) => {
        console.log('[Global Realtime] community_votes change:', payload.eventType);
        notifySubscribers('community_votes');
      })
      // Workforce jobs - for job postings
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workforce_jobs' }, (payload) => {
        console.log('[Global Realtime] workforce_jobs change:', payload.eventType);
        notifySubscribers('workforce_jobs');
      })
      // Workforce applications - for job applications
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workforce_applications' }, (payload) => {
        console.log('[Global Realtime] workforce_applications change:', payload.eventType);
        notifySubscribers('workforce_applications');
      })
      // Progress updates - for project progress
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_progress' }, (payload) => {
        console.log('[Global Realtime] project_progress change:', payload.eventType);
        notifySubscribers('project_progress');
      })
      // Role requests - for role change requests
      .on('postgres_changes', { event: '*', schema: 'public', table: 'role_requests' }, (payload) => {
        console.log('[Global Realtime] role_requests change:', payload.eventType);
        notifySubscribers('role_requests');
      })
      // Notifications - for real-time notification updates
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        console.log('[Global Realtime] notifications change:', payload.eventType);
        notifySubscribers('notifications');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Global Realtime] Connected successfully');
          setConnectionStatus('connected');
          setIsConnected(true);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[Global Realtime] Connection error');
          setConnectionStatus('error');
          setIsConnected(false);
        } else if (status === 'TIMED_OUT') {
          console.warn('[Global Realtime] Connection timed out');
          setConnectionStatus('error');
          setIsConnected(false);
        } else if (status === 'CLOSED') {
          console.log('[Global Realtime] Connection closed');
          setConnectionStatus('disconnected');
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log('[Global Realtime] Cleaning up connection');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (eventCleanupRef.current) {
        eventCleanupRef.current();
        eventCleanupRef.current = null;
      }
    };
  }, [isAuthenticated, user, notifySubscribers]);

  // Set up RealtimeEventService for system alerts
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Initialize event listeners for system alerts
    const cleanup = RealtimeEventService.setupEventListeners(
      user.id,
      user.user_type || 'citizen'
    );
    eventCleanupRef.current = cleanup;

    return () => {
      if (eventCleanupRef.current) {
        eventCleanupRef.current();
        eventCleanupRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  const value: RealtimeContextType = {
    isConnected,
    lastUpdate,
    connectionStatus,
    triggerRefresh,
    subscribeToRefresh,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

/**
 * Hook to access the global realtime context
 */
export const useRealtimeContext = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider');
  }
  return context;
};

/**
 * Hook to subscribe to specific table changes from the global realtime provider
 */
export const useGlobalRealtimeRefresh = (
  tables: string[],
  onRefresh: () => void,
  enabled: boolean = true
) => {
  const { subscribeToRefresh } = useRealtimeContext();

  useEffect(() => {
    if (!enabled) return;

    const unsubscribe = subscribeToRefresh((changedTables) => {
      // Check if any of the changed tables match our watched tables
      const shouldRefresh = changedTables.some(table => tables.includes(table));
      if (shouldRefresh) {
        onRefresh();
      }
    });

    return unsubscribe;
  }, [tables, onRefresh, enabled, subscribeToRefresh]);
};

export default RealtimeProvider;
