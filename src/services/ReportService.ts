
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export interface ProblemReport {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: string;
  coordinates?: string;
  estimated_cost?: number;
  affected_population?: number;
  status: string;
  reported_by: string;
  created_at: string;
  updated_at: string;
}

export interface ContractorBid {
  id: string;
  report_id: string;
  contractor_id: string;
  bid_amount: number;
  proposal: string;
  estimated_duration: number;
  status: string;
  created_at: string;
}

export class ReportService {
  static async submitReport(reportData: {
    title: string;
    description: string;
    category: string;
    priority: string;
    location: string;
    coordinates?: string;
    estimatedCost?: number;
    affectedPopulation?: number;
  }): Promise<ProblemReport> {
    const { data, error } = await supabase.functions.invoke('submit-report', {
      body: reportData
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.report;
  }

  static async getReports(filters?: {
    category?: string;
    priority?: string;
    status?: string;
  }): Promise<ProblemReport[]> {
    let query = supabase
      .from('problem_reports')
      .select(`
        id,
        title,
        description,
        category,
        priority,
        location,
        coordinates,
        estimated_cost,
        affected_population,
        status,
        reported_by,
        created_at,
        updated_at,
        user_profiles!reported_by (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  static async submitBid(bidData: {
    reportId: string;
    bidAmount: number;
    proposal: string;
    estimatedDuration: number;
    projectTitle: string;
  }): Promise<ContractorBid> {
    const { data, error } = await supabase.functions.invoke('submit-bid', {
      body: bidData
    });

    if (error) {
      throw new Error(error.message);
    }

    return data.bid;
  }

  static async getBidsForReport(reportId: string): Promise<ContractorBid[]> {
    const { data, error } = await supabase
      .from('contractor_bids')
      .select(`
        *,
        user_profiles!contractor_id (
          name,
          organization,
          is_verified
        )
      `)
      .eq('report_id', reportId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  }

  static async voteOnReport(reportId: string, voteType: 'upvote' | 'downvote') {
    const { data, error } = await supabase.functions.invoke('vote-report', {
      body: { reportId, voteType }
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async getVotesForReport(reportId: string) {
    const { data, error } = await supabase
      .from('community_votes')
      .select('vote_type')
      .eq('report_id', reportId);

    if (error) {
      throw new Error(error.message);
    }

    const upvotes = data?.filter(v => v.vote_type === 'upvote').length || 0;
    const downvotes = data?.filter(v => v.vote_type === 'downvote').length || 0;

    return { upvotes, downvotes };
  }

  static async uploadFile(file: File, reportId?: string, projectId?: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('report-files')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    // Record file upload in database
    const { error: dbError } = await supabase
      .from('file_uploads')
      .insert({
        report_id: reportId,
        project_id: projectId,
        file_name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size
      });

    if (dbError) {
      console.error('Error recording file upload:', dbError);
    }

    return filePath;
  }
}
