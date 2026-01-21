import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface SubscriptionConfig {
  table: string;
  schema?: string;
  event?: RealtimeEvent;
  filter?: string;
}

export interface UseRealtimeSubscriptionOptions {
  /**
   * Array of table subscriptions to set up
   */
  subscriptions: SubscriptionConfig[];
  /**
   * Callback when any change occurs - typically used to refetch data
   */
  onDataChange: () => void;
  /**
   * Optional callback with specific payload for granular updates
   */
  onPayload?: (payload: RealtimePostgresChangesPayload<any>, table: string) => void;
  /**
   * Whether to enable the subscription (default: true)
   */
  enabled?: boolean;
  /**
   * Debounce time in ms to prevent rapid re-fetches (default: 100)
   */
  debounceMs?: number;
  /**
   * Channel name prefix (default: 'realtime-sub')
   */
  channelPrefix?: string;
}

/**
 * Custom hook for setting up real-time Supabase subscriptions
 * Provides a clean interface for subscribing to multiple tables with automatic cleanup
 */
export const useRealtimeSubscription = ({
  subscriptions,
  onDataChange,
  onPayload,
  enabled = true,
  debounceMs = 100,
  channelPrefix = 'realtime-sub'
}: UseRealtimeSubscriptionOptions) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastChangeRef = useRef<number>(0);

  // Debounced data change handler
  const handleDataChange = useCallback(() => {
    const now = Date.now();
    
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If enough time has passed since last change, execute immediately
    if (now - lastChangeRef.current > debounceMs) {
      lastChangeRef.current = now;
      onDataChange();
    } else {
      // Otherwise debounce
      debounceTimerRef.current = setTimeout(() => {
        lastChangeRef.current = Date.now();
        onDataChange();
      }, debounceMs);
    }
  }, [onDataChange, debounceMs]);

  useEffect(() => {
    if (!enabled || subscriptions.length === 0) {
      return;
    }

    // Generate unique channel name
    const channelName = `${channelPrefix}-${subscriptions.map(s => s.table).join('-')}-${Date.now()}`;
    
    // Create channel
    let channel = supabase.channel(channelName);

    // Add subscriptions for each table
    subscriptions.forEach(({ table, schema = 'public', event = '*', filter }) => {
      const config: any = {
        event,
        schema,
        table,
      };

      if (filter) {
        config.filter = filter;
      }

      channel = channel.on(
        'postgres_changes',
        config,
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log(`[Realtime] ${table} ${payload.eventType}:`, payload);
          
          // Call specific payload handler if provided
          if (onPayload) {
            onPayload(payload, table);
          }

          // Trigger data refresh
          handleDataChange();
        }
      );
    });

    // Subscribe to channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Subscribed to: ${subscriptions.map(s => s.table).join(', ')}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`[Realtime] Channel error for: ${channelName}`);
      }
    });

    channelRef.current = channel;

    // Cleanup on unmount or when dependencies change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (channelRef.current) {
        console.log(`[Realtime] Unsubscribing from: ${channelName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, subscriptions, handleDataChange, onPayload, channelPrefix]);

  // Return a method to manually trigger refresh
  return {
    refresh: onDataChange,
    isSubscribed: !!channelRef.current
  };
};

/**
 * Preset subscription configurations for common use cases
 */
export const REALTIME_PRESETS = {
  governmentDashboard: [
    { table: 'problem_reports', event: '*' as RealtimeEvent },
    { table: 'contractor_bids', event: '*' as RealtimeEvent },
    { table: 'projects', event: '*' as RealtimeEvent },
    { table: 'community_votes', event: 'INSERT' as RealtimeEvent },
  ],
  
  contractorDashboard: [
    { table: 'projects', event: '*' as RealtimeEvent },
    { table: 'contractor_bids', event: '*' as RealtimeEvent },
    { table: 'project_milestones', event: '*' as RealtimeEvent },
    { table: 'escrow_accounts', event: '*' as RealtimeEvent },
    { table: 'payment_transactions', event: '*' as RealtimeEvent },
  ],
  
  citizenDashboard: [
    { table: 'problem_reports', event: '*' as RealtimeEvent },
    { table: 'projects', event: '*' as RealtimeEvent },
    { table: 'project_milestones', event: '*' as RealtimeEvent },
    { table: 'community_votes', event: '*' as RealtimeEvent },
  ],
  
  projectTracking: [
    { table: 'project_milestones', event: '*' as RealtimeEvent },
    { table: 'project_progress', event: '*' as RealtimeEvent },
    { table: 'milestone_verifications', event: '*' as RealtimeEvent },
    { table: 'escrow_accounts', event: '*' as RealtimeEvent },
    { table: 'payment_transactions', event: '*' as RealtimeEvent },
  ],
  
  bidding: [
    { table: 'contractor_bids', event: '*' as RealtimeEvent },
    { table: 'problem_reports', event: 'UPDATE' as RealtimeEvent },
  ],
  
  workforce: [
    { table: 'workforce_jobs', event: '*' as RealtimeEvent },
    { table: 'workforce_applications', event: '*' as RealtimeEvent },
  ],
};

export default useRealtimeSubscription;
