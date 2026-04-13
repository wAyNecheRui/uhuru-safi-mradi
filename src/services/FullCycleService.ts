/**
 * FullCycleService - Complete Workflow Cycle Management
 * 
 * Implements ALL 4 core cycles:
 * 1. Citizen Problem Identification Cycle - Community-driven reporting
 * 2. Contractor Trust & Verification Cycle - Vetting & accountability
 * 3. Workforce Integration Cycle - Local employment
 * 4. Accountability & Transparency Cycle - Public records
 */

import { supabase } from '@/integrations/supabase/client';
import { MIN_VOTES_THRESHOLD } from './WorkflowGuardService';

// ============================================================================
// CYCLE 1: CITIZEN PROBLEM IDENTIFICATION
// ============================================================================

export interface ProblemSubmission {
  title: string;
  description: string;
  category: string;
  priority: string;
  location: string;
  coordinates?: string;
  gps_coordinates?: { lat: number; lng: number };
  photo_urls?: string[];
  video_urls?: string[];
  estimated_cost?: number;
  affected_population?: number;
  impact_assessment?: ImpactAssessment;
  constituency?: string;
  ward?: string;
}

export interface ImpactAssessment {
  healthcare_access: boolean;
  education_access: boolean;
  economic_impact: boolean;
  safety_concern: boolean;
  environmental_impact: boolean;
  daily_activities_affected: string;
  urgency_level: 'immediate' | 'short_term' | 'long_term';
  estimated_affected_households: number;
}

export interface CommunityValidationResult {
  reportId: string;
  totalVotes: number;
  upvotes: number;
  downvotes: number;
  priorityScore: number;
  verifiedVoters: number;
  reachedThreshold: boolean;
  communityComments: { userId: string; comment: string; timestamp: string }[];
}

export class CitizenProblemCycle {
  /**
   * Submit a new problem report with full documentation
   */
  static async submitProblemReport(data: ProblemSubmission): Promise<{ success: boolean; reportId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Authentication required' };

      const { data: report, error } = await supabase
        .from('problem_reports')
        .insert({
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          location: data.location,
          coordinates: data.coordinates,
          photo_urls: data.photo_urls || [],
          video_urls: data.video_urls || [],
          estimated_cost: data.estimated_cost,
          affected_population: data.affected_population,
          constituency: data.constituency,
          ward: data.ward,
          reported_by: user.id,
          status: 'pending',
          priority_score: 0
        })
        .select('id')
        .single();

      if (error) throw error;

      return { success: true, reportId: report.id };
    } catch (error: any) {
      console.error('Error submitting problem report:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get community validation status for a report
   */
  static async getCommunityValidation(reportId: string): Promise<CommunityValidationResult | null> {
    try {
      // Get votes
      const { data: votes, error: votesError } = await supabase
        .from('community_votes')
        .select('vote_type, user_id, comment, created_at')
        .eq('report_id', reportId);

      if (votesError) throw votesError;

      const upvotes = votes?.filter(v => v.vote_type === 'upvote').length || 0;
      const downvotes = votes?.filter(v => v.vote_type === 'downvote').length || 0;

      // Get verified voters count
      const uniqueVoters = new Set(votes?.map(v => v.user_id) || []);

      // Get comments
      const comments = votes
        ?.filter(v => v.comment)
        .map(v => ({
          userId: v.user_id,
          comment: v.comment || '',
          timestamp: v.created_at
        })) || [];

      return {
        reportId,
        totalVotes: (upvotes + downvotes),
        upvotes,
        downvotes,
        priorityScore: upvotes - downvotes,
        verifiedVoters: uniqueVoters.size,
        reachedThreshold: (upvotes + downvotes) >= MIN_VOTES_THRESHOLD,
        communityComments: comments
      };
    } catch (error) {
      console.error('Error getting community validation:', error);
      return null;
    }
  }

  /**
   * Get priority-ranked problems for government review
   */
  static async getPriorityRankedProblems(limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('problem_reports')
      .select(`
        *,
        community_votes(vote_type)
      `)
      .eq('status', 'pending')
      .order('priority_score', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(report => ({
      ...report,
      voteCount: report.community_votes?.length || 0,
      upvotes: report.community_votes?.filter((v: any) => v.vote_type === 'upvote').length || 0,
      downvotes: report.community_votes?.filter((v: any) => v.vote_type === 'downvote').length || 0
    }));
  }
}

// ============================================================================
// CYCLE 2: CONTRACTOR TRUST & VERIFICATION
// ============================================================================

export interface ContractorRegistration {
  company_name: string;
  kra_pin: string;
  company_registration_number: string;
  years_in_business: number;
  number_of_employees: number;
  specialization: string[];
  registered_counties: string[];
  max_project_capacity: number;
  is_agpo: boolean;
  agpo_category?: string;
}

export interface ContractorCapacityAssessment {
  contractorId: string;
  financialCapacity: number;
  projectCapacity: number;
  currentActiveProjects: number;
  maxConcurrentProjects: number;
  availableCapacity: number;
  qualifiedForProjectSize: 'small' | 'medium' | 'large' | 'mega';
  verificationStatus: string;
  rating: number;
  completedProjects: number;
}

export interface BidEvaluation {
  bidId: string;
  contractorId: string;
  priceScore: number;
  technicalScore: number;
  experienceScore: number;
  agpoBonus: number;
  totalScore: number;
  rank: number;
}

export class ContractorVerificationCycle {
  /**
   * Register a new contractor with all required credentials
   */
  static async registerContractor(data: ContractorRegistration): Promise<{ success: boolean; profileId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Authentication required' };

      const { data: profile, error } = await supabase
        .from('contractor_profiles')
        .upsert({
          user_id: user.id,
          company_name: data.company_name,
          kra_pin: data.kra_pin,
          company_registration_number: data.company_registration_number,
          years_in_business: data.years_in_business,
          number_of_employees: data.number_of_employees,
          specialization: data.specialization,
          registered_counties: data.registered_counties,
          max_project_capacity: data.max_project_capacity,
          is_agpo: data.is_agpo,
          agpo_category: data.agpo_category,
          verified: false,
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;

      return { success: true, profileId: profile.id };
    } catch (error: any) {
      console.error('Error registering contractor:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Assess contractor's financial and project capacity
   */
  static async assessContractorCapacity(contractorId: string): Promise<ContractorCapacityAssessment | null> {
    try {
      // Get contractor profile
      const { data: profile } = await supabase
        .from('contractor_profiles')
        .select('*')
        .eq('user_id', contractorId)
        .single();

      // Get active projects
      const { data: activeProjects } = await supabase
        .from('projects')
        .select('id, budget')
        .eq('contractor_id', contractorId)
        .in('status', ['planning', 'in_progress']);

      // Get completed projects and ratings
      const { data: completedProjects } = await supabase
        .from('projects')
        .select('id')
        .eq('contractor_id', contractorId)
        .eq('status', 'completed');

      const { data: ratings } = await supabase
        .from('contractor_ratings')
        .select('rating')
        .eq('contractor_id', contractorId);

      const avgRating = ratings && ratings.length > 0
        ? ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / ratings.length
        : 0;

      const maxCapacity = profile?.max_project_capacity || 0;
      const currentActiveValue = activeProjects?.reduce((acc, p) => acc + (p.budget || 0), 0) || 0;
      const availableCapacity = Math.max(0, maxCapacity - currentActiveValue);

      // Determine qualified project size
      let qualifiedSize: 'small' | 'medium' | 'large' | 'mega' = 'small';
      if (maxCapacity >= 1000000000) qualifiedSize = 'mega';
      else if (maxCapacity >= 100000000) qualifiedSize = 'large';
      else if (maxCapacity >= 10000000) qualifiedSize = 'medium';

      return {
        contractorId,
        financialCapacity: maxCapacity,
        projectCapacity: maxCapacity,
        currentActiveProjects: activeProjects?.length || 0,
        maxConcurrentProjects: 5, // Business rule
        availableCapacity,
        qualifiedForProjectSize: qualifiedSize,
        verificationStatus: profile?.verified ? 'verified' : 'pending',
        rating: avgRating,
        completedProjects: completedProjects?.length || 0
      };
    } catch (error) {
      console.error('Error assessing contractor capacity:', error);
      return null;
    }
  }

  /**
   * Get bid evaluations with transparent scoring
   */
  static async getBidEvaluations(reportId: string): Promise<BidEvaluation[]> {
    const { data: bids, error } = await supabase
      .from('contractor_bids')
      .select('*')
      .eq('report_id', reportId)
      .order('total_score', { ascending: false });

    if (error) throw error;

    return (bids || []).map((bid, index) => ({
      bidId: bid.id,
      contractorId: bid.contractor_id,
      priceScore: bid.price_score || 0,
      technicalScore: bid.technical_score || 0,
      experienceScore: bid.experience_score || 0,
      agpoBonus: bid.agpo_bonus || 0,
      totalScore: bid.total_score || 0,
      rank: index + 1
    }));
  }

  /**
   * Get contractor's permanent accountability record
   */
  static async getAccountabilityRecord(contractorId: string): Promise<{
    totalProjects: number;
    completedProjects: number;
    averageRating: number;
    onTimeCompletion: number;
    qualityScore: number;
    communicationScore: number;
    contractValue: number;
    recentProjects: any[];
  }> {
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .eq('contractor_id', contractorId);

    const { data: ratings } = await supabase
      .from('contractor_ratings')
      .select('*')
      .eq('contractor_id', contractorId);

    const completed = projects?.filter(p => p.status === 'completed') || [];
    const totalValue = completed.reduce((acc, p) => acc + (p.budget || 0), 0);

    const avgRating = ratings && ratings.length > 0
      ? ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / ratings.length
      : 0;

    const avgQuality = ratings && ratings.length > 0
      ? ratings.reduce((acc, r) => acc + (r.work_quality || 0), 0) / ratings.length
      : 0;

    const avgComm = ratings && ratings.length > 0
      ? ratings.reduce((acc, r) => acc + (r.communication || 0), 0) / ratings.length
      : 0;

    const avgTimeliness = ratings && ratings.length > 0
      ? ratings.reduce((acc, r) => acc + (r.completion_timeliness || 0), 0) / ratings.length
      : 0;

    return {
      totalProjects: projects?.length || 0,
      completedProjects: completed.length,
      averageRating: avgRating,
      onTimeCompletion: avgTimeliness,
      qualityScore: avgQuality,
      communicationScore: avgComm,
      contractValue: totalValue,
      recentProjects: (projects || []).slice(0, 10)
    };
  }
}

// ============================================================================
// CYCLE 3: WORKFORCE INTEGRATION
// ============================================================================

export interface WorkerRegistration {
  phone_number: string;
  county: string;
  sub_county?: string;
  ward?: string;
  skills: string[];
  experience_years: number;
  education_level?: string;
  certifications?: string[];
  hourly_rate?: number;
  daily_rate?: number;
  willing_to_travel: boolean;
  max_travel_distance?: number;
}

export interface JobMatch {
  jobId: string;
  matchScore: number;
  skillMatch: number;
  locationMatch: boolean;
  proximityKm?: number;
  wageRange: { min: number; max: number };
}

export interface WorkerPerformance {
  workerId: string;
  totalJobsCompleted: number;
  averageRating: number;
  reliabilityScore: number;
  skillEndorsements: { skill: string; count: number }[];
  earnedWages: number;
}

export class WorkforceIntegrationCycle {
  /**
   * Register a citizen worker with skills and location
   */
  static async registerWorker(data: WorkerRegistration): Promise<{ success: boolean; workerId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { success: false, error: 'Authentication required' };

      const { data: worker, error } = await supabase
        .from('citizen_workers')
        .upsert({
          user_id: user.id,
          phone_number: data.phone_number,
          county: data.county,
          sub_county: data.sub_county,
          ward: data.ward,
          skills: data.skills,
          experience_years: data.experience_years,
          education_level: data.education_level,
          certifications: data.certifications || [],
          hourly_rate: data.hourly_rate,
          daily_rate: data.daily_rate,
          willing_to_travel: data.willing_to_travel,
          max_travel_distance: data.max_travel_distance,
          availability_status: 'available',
          verification_status: 'pending',
          rating: 0,
          total_jobs_completed: 0
        })
        .select('id')
        .single();

      if (error) throw error;

      return { success: true, workerId: worker.id };
    } catch (error: any) {
      console.error('Error registering worker:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Find matching jobs for a worker based on skills and location
   */
  static async findMatchingJobs(authUserId: string): Promise<JobMatch[]> {
    try {
      // Get worker profile - use user_id since callers pass auth UUID
      const { data: worker } = await supabase
        .from('citizen_workers')
        .select('*')
        .eq('user_id', authUserId)
        .single();

      if (!worker) return [];

      // Get open jobs
      const { data: jobs } = await supabase
        .from('workforce_jobs')
        .select('*')
        .eq('status', 'open');

      if (!jobs) return [];

      // Calculate match scores
      const matches: JobMatch[] = jobs.map(job => {
        const workerSkills = new Set(worker.skills || []);
        const requiredSkills = job.required_skills || [];

        // Calculate skill match percentage
        const matchedSkills = requiredSkills.filter((s: string) => workerSkills.has(s)).length;
        const skillMatch = requiredSkills.length > 0
          ? (matchedSkills / requiredSkills.length) * 100
          : 50;

        // Check location match
        const locationMatch = job.location?.toLowerCase().includes(worker.county.toLowerCase()) || false;

        // Calculate overall match score
        const matchScore = (skillMatch * 0.7) + (locationMatch ? 30 : 0);

        return {
          jobId: job.id,
          matchScore,
          skillMatch,
          locationMatch,
          wageRange: { min: job.wage_min || 0, max: job.wage_max || 0 }
        };
      });

      // Sort by match score and filter high matches
      return matches
        .filter(m => m.matchScore >= 40)
        .sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      console.error('Error finding matching jobs:', error);
      return [];
    }
  }

  /**
   * Get worker performance history
   */
  static async getWorkerPerformance(authUserId: string): Promise<WorkerPerformance | null> {
    try {
      // Use user_id since callers pass auth UUID
      const { data: worker } = await supabase
        .from('citizen_workers')
        .select('*')
        .eq('user_id', authUserId)
        .single();

      if (!worker) return null;

      // Get completed job applications
      const { data: completedJobs } = await supabase
        .from('job_applications')
        .select('*, workforce_jobs(wage_min, wage_max, duration_days)')
        .eq('applicant_id', worker.user_id)
        .eq('status', 'accepted');

      // Calculate estimated earnings
      const earnedWages = completedJobs?.reduce((acc, app) => {
        const job = app.workforce_jobs;
        if (job) {
          const avgWage = ((job.wage_min || 0) + (job.wage_max || 0)) / 2;
          return acc + (avgWage * (job.duration_days || 1));
        }
        return acc;
      }, 0) || 0;

      return {
        workerId: authUserId,
        totalJobsCompleted: worker.total_jobs_completed || 0,
        averageRating: worker.rating || 0,
        reliabilityScore: worker.rating ? worker.rating * 20 : 0, // Convert 5-point to 100-point scale
        skillEndorsements: worker.skills?.map((s: string) => ({ skill: s, count: 1 })) || [],
        earnedWages
      };
    } catch (error) {
      console.error('Error getting worker performance:', error);
      return null;
    }
  }

  /**
   * Get local workers for a project location
   */
  static async getLocalWorkers(county: string, requiredSkills: string[]): Promise<any[]> {
    const { data, error } = await supabase
      .from('citizen_workers')
      .select('*')
      .eq('county', county)
      .eq('availability_status', 'available')
      .eq('verification_status', 'verified')
      .order('rating', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Filter and score by skill match
    const skillSet = new Set(requiredSkills);
    return (data || [])
      .map(worker => {
        const matchedSkills = (worker.skills || []).filter((s: string) => skillSet.has(s));
        return {
          ...worker,
          skillMatchCount: matchedSkills.length,
          skillMatchPercent: requiredSkills.length > 0
            ? (matchedSkills.length / requiredSkills.length) * 100
            : 0
        };
      })
      .filter(w => w.skillMatchCount > 0)
      .sort((a, b) => b.skillMatchPercent - a.skillMatchPercent);
  }
}

// ============================================================================
// CYCLE 4: ACCOUNTABILITY & TRANSPARENCY
// ============================================================================

export interface RegionalDevelopmentStats {
  county: string;
  totalProjects: number;
  completedProjects: number;
  totalBudget: number;
  fundsReleased: number;
  activeContractors: number;
  localWorkersEmployed: number;
  citizensImpacted: number;
  averageProjectRating: number;
}

export interface CommunityImpactMeasurement {
  projectId: string;
  projectTitle: string;
  location: string;
  category: string;
  budget: number;
  affectedPopulation: number;
  completionDate?: string;
  impactScore: number;
  metrics: {
    accessImproved: boolean;
    safetyEnhanced: boolean;
    economicBenefit: boolean;
    environmentalImpact: string;
  };
}

export class AccountabilityTransparencyCycle {
  /**
   * Get public transparency data for all projects
   */
  static async getPublicTransparencyData(): Promise<{
    overview: {
      totalProjects: number;
      totalBudget: number;
      completedProjects: number;
      fundsReleased: number;
      activeContractors: number;
      citizensImpacted: number;
    };
    projectsByStatus: { status: string; count: number }[];
    projectsByCategory: { category: string; count: number }[];
    recentCompletions: any[];
  }> {
    try {
      // Get all projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*, problem_reports(category, affected_population, location)');

      // Get escrow data
      const { data: escrows } = await supabase
        .from('escrow_accounts')
        .select('total_amount, released_amount');

      // Get unique contractors
      const { data: contractors } = await supabase
        .from('contractor_profiles')
        .select('user_id')
        .eq('verified', true);

      const totalBudget = projects?.reduce((acc, p) => acc + (p.budget || 0), 0) || 0;
      const fundsReleased = escrows?.reduce((acc, e) => acc + (e.released_amount || 0), 0) || 0;
      const completedProjects = projects?.filter(p => p.status === 'completed') || [];
      const citizensImpacted = projects?.reduce((acc, p) =>
        acc + (p.problem_reports?.affected_population || 0), 0) || 0;

      // Group by status
      const statusCounts: { [key: string]: number } = {};
      projects?.forEach(p => {
        const status = p.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      // Group by category
      const categoryCounts: { [key: string]: number } = {};
      projects?.forEach(p => {
        const category = p.problem_reports?.category || 'uncategorized';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });

      return {
        overview: {
          totalProjects: projects?.length || 0,
          totalBudget,
          completedProjects: completedProjects.length,
          fundsReleased,
          activeContractors: contractors?.length || 0,
          citizensImpacted
        },
        projectsByStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
        projectsByCategory: Object.entries(categoryCounts).map(([category, count]) => ({ category, count })),
        recentCompletions: completedProjects.slice(0, 10)
      };
    } catch (error) {
      console.error('Error getting public transparency data:', error);
      throw error;
    }
  }

  /**
   * Get regional development statistics
   */
  static async getRegionalDevelopmentStats(county?: string): Promise<RegionalDevelopmentStats[]> {
    try {
      // Get all projects with location data
      const { data: projects } = await supabase
        .from('projects')
        .select('*, problem_reports(location, affected_population, category), escrow_accounts(total_amount, released_amount)');

      // Get workers by county
      const { data: workers } = await supabase
        .from('citizen_workers')
        .select('county, id')
        .eq('verification_status', 'verified');

      // Get ratings
      const { data: ratings } = await supabase
        .from('contractor_ratings')
        .select('project_id, rating');

      // Group projects by county (extracted from location)
      const countyStats: { [key: string]: RegionalDevelopmentStats } = {};

      projects?.forEach(project => {
        // Try to extract county from location
        const location = project.problem_reports?.location || '';
        // Simple extraction - look for known county names or use first word
        const countyMatch = location.split(',').pop()?.trim() || 'Unknown';

        if (!countyStats[countyMatch]) {
          countyStats[countyMatch] = {
            county: countyMatch,
            totalProjects: 0,
            completedProjects: 0,
            totalBudget: 0,
            fundsReleased: 0,
            activeContractors: 0,
            localWorkersEmployed: 0,
            citizensImpacted: 0,
            averageProjectRating: 0
          };
        }

        const stats = countyStats[countyMatch];
        stats.totalProjects++;
        stats.totalBudget += project.budget || 0;
        stats.citizensImpacted += project.problem_reports?.affected_population || 0;

        if (project.status === 'completed') {
          stats.completedProjects++;
        }

        // escrow_accounts is an array from the join - take the first one if exists
        const escrow = Array.isArray(project.escrow_accounts)
          ? project.escrow_accounts[0]
          : project.escrow_accounts;
        if (escrow) {
          stats.fundsReleased += escrow.released_amount || 0;
        }
      });

      // Add worker counts
      workers?.forEach(worker => {
        if (countyStats[worker.county]) {
          countyStats[worker.county].localWorkersEmployed++;
        }
      });

      // Filter by county if specified
      const result = Object.values(countyStats);
      if (county) {
        return result.filter(s => s.county.toLowerCase().includes(county.toLowerCase()));
      }

      return result.sort((a, b) => b.totalProjects - a.totalProjects);
    } catch (error) {
      console.error('Error getting regional development stats:', error);
      return [];
    }
  }

  /**
   * Get community impact measurements for a project
   */
  static async getCommunityImpactMeasurement(projectId: string): Promise<CommunityImpactMeasurement | null> {
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('*, problem_reports(*)')
        .eq('id', projectId)
        .single();

      if (!project) return null;

      const report = project.problem_reports;

      // Calculate impact score based on multiple factors
      let impactScore = 0;

      // Budget impact (up to 30 points)
      if (project.budget) {
        if (project.budget >= 100000000) impactScore += 30;
        else if (project.budget >= 10000000) impactScore += 20;
        else if (project.budget >= 1000000) impactScore += 10;
        else impactScore += 5;
      }

      // Population impact (up to 30 points)
      if (report?.affected_population) {
        if (report.affected_population >= 10000) impactScore += 30;
        else if (report.affected_population >= 1000) impactScore += 20;
        else if (report.affected_population >= 100) impactScore += 10;
        else impactScore += 5;
      }

      // Completion status (up to 40 points)
      if (project.status === 'completed') impactScore += 40;
      else if (project.status === 'in_progress') impactScore += 20;

      return {
        projectId,
        projectTitle: project.title,
        location: report?.location || 'Unknown',
        category: report?.category || 'uncategorized',
        budget: project.budget || 0,
        affectedPopulation: report?.affected_population || 0,
        completionDate: project.status === 'completed' ? project.updated_at : undefined,
        impactScore,
        metrics: {
          accessImproved: ['road', 'transport', 'water', 'electricity'].includes(report?.category?.toLowerCase() || ''),
          safetyEnhanced: ['security', 'road', 'drainage'].includes(report?.category?.toLowerCase() || ''),
          economicBenefit: project.budget ? project.budget > 0 : false,
          environmentalImpact: report?.category === 'environment' ? 'positive' : 'neutral'
        }
      };
    } catch (error) {
      console.error('Error getting community impact measurement:', error);
      return null;
    }
  }

  /**
   * Get contractor performance records for public display
   */
  static async getPublicContractorRecords(): Promise<any[]> {
    const { data, error } = await supabase
      .from('contractor_profiles')
      .select(`
        id,
        company_name,
        years_in_business,
        specialization,
        average_rating,
        previous_projects_count,
        verified,
        is_agpo,
        agpo_category
      `)
      .eq('verified', true)
      .order('average_rating', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
