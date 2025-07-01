
import { useState, useEffect } from 'react';
import { ReportService, ProblemReport, ContractorBid } from '@/services/ReportService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useBackendReports = () => {
  const [reports, setReports] = useState<ProblemReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const fetchReports = async (filters?: {
    category?: string;
    priority?: string;
    status?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await ReportService.getReports(filters);
      setReports(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch reports';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const submitReport = async (reportData: {
    title: string;
    description: string;
    category: string;
    priority: string;
    location: string;
    coordinates?: string;
    estimatedCost?: number;
    affectedPopulation?: number;
  }) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a report.",
        variant: "destructive"
      });
      return null;
    }

    setLoading(true);
    try {
      const report = await ReportService.submitReport(reportData);
      await fetchReports(); // Refresh the list
      
      toast({
        title: "Success",
        description: "Report submitted successfully!",
      });
      
      return report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit report';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const submitBid = async (bidData: {
    reportId: string;
    bidAmount: number;
    proposal: string;
    estimatedDuration: number;
    projectTitle: string;
  }) => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a bid.",
        variant: "destructive"
      });
      return null;
    }

    try {
      const bid = await ReportService.submitBid(bidData);
      toast({
        title: "Success",
        description: "Bid submitted successfully!",
      });
      return bid;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit bid';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    }
  };

  const voteOnReport = async (reportId: string, voteType: 'upvote' | 'downvote') => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to vote.",
        variant: "destructive"
      });
      return null;
    }

    try {
      const result = await ReportService.voteOnReport(reportId, voteType);
      toast({
        title: "Success",
        description: "Vote recorded successfully!",
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to record vote';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return {
    reports,
    loading,
    error,
    fetchReports,
    submitReport,
    submitBid,
    voteOnReport
  };
};
