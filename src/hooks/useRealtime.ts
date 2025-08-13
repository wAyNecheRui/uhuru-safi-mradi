import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { RealtimeProjectUpdate } from '@/types/workforce';

export const useRealtime = (projectId?: string) => {
  const [updates, setUpdates] = useState<RealtimeProjectUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchUpdates = async (id?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('realtime_project_updates')
        .select('*')
        .order('created_at', { ascending: false });

      if (id) {
        query = query.eq('project_id', id);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      setUpdates(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching updates",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sendUpdate = async (
    projectId: string, 
    updateType: string, 
    message: string, 
    metadata: Record<string, any> = {}
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('realtime_project_updates')
        .insert({
          project_id: projectId,
          update_type: updateType,
          message,
          metadata,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Update sent",
        description: "Project update has been posted."
      });

      fetchUpdates(projectId);
    } catch (error: any) {
      toast({
        title: "Error sending update",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchUpdates(projectId);

    // Set up real-time subscription
    const channel = supabase
      .channel('project_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'realtime_project_updates',
          filter: projectId ? `project_id=eq.${projectId}` : undefined
        },
        (payload) => {
          setUpdates(prev => [payload.new as RealtimeProjectUpdate, ...prev]);
          toast({
            title: "New project update",
            description: (payload.new as RealtimeProjectUpdate).message
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return {
    updates,
    loading,
    sendUpdate,
    fetchUpdates
  };
};