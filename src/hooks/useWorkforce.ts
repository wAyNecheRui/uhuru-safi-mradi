import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { WorkforceJob, JobApplication } from '@/types/workforce';

export const useWorkforce = () => {
  const [jobs, setJobs] = useState<WorkforceJob[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('workforce_jobs')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching jobs",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserApplications = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select('*, workforce_jobs(*)')
        .eq('applicant_id', userId)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching applications",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const applyForJob = async (jobId: string, applicationMessage: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in to apply');

      const { error } = await supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          applicant_id: user.id,
          application_message: applicationMessage
        });

      if (error) throw error;

      toast({
        title: "Application submitted",
        description: "Your job application has been submitted successfully."
      });

      fetchUserApplications(user.id);
    } catch (error: any) {
      toast({
        title: "Error submitting application",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const createJob = async (jobData: Partial<WorkforceJob>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in to create jobs');

      const { error } = await supabase
        .from('workforce_jobs')
        .insert({
          title: jobData.title || '',
          description: jobData.description || '',
          location: jobData.location || '',
          required_skills: jobData.required_skills || [],
          wage_min: jobData.wage_min,
          wage_max: jobData.wage_max,
          duration_days: jobData.duration_days,
          positions_available: jobData.positions_available || 1,
          project_id: jobData.project_id,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Job created",
        description: "Job posting has been created successfully."
      });

      fetchJobs();
    } catch (error: any) {
      toast({
        title: "Error creating job",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const reviewApplication = async (applicationId: string, status: 'accepted' | 'rejected') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('job_applications')
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Application reviewed",
        description: `Application has been ${status}.`
      });
    } catch (error: any) {
      toast({
        title: "Error reviewing application",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  return {
    jobs,
    applications,
    loading,
    fetchJobs,
    fetchUserApplications,
    applyForJob,
    createJob,
    reviewApplication
  };
};