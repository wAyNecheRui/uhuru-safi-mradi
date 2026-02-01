import { supabase } from '@/integrations/supabase/client';

interface ContractorRating {
  averageRating: number;
  totalRatings: number;
  ratings: {
    rating: number;
    source: 'milestone_verification' | 'quality_checkpoint';
    projectId: string;
    date: string;
  }[];
}

/**
 * Extracts rating from milestone verification notes
 * Format: "... - Rating: X/5" or "Rating: X/5"
 */
function extractRatingFromNotes(notes: string | null): number | null {
  if (!notes) return null;
  const match = notes.match(/Rating:\s*(\d+(?:\.\d+)?)\s*\/\s*5/i);
  if (match) {
    return parseFloat(match[1]);
  }
  return null;
}

/**
 * Converts quality checkpoint score (0-100) to 5-star rating
 */
function scoreToRating(score: number): number {
  return Math.round((score / 100) * 5 * 10) / 10; // Round to 1 decimal
}

/**
 * Fetches all ratings for contractors from milestone_verifications and quality_checkpoints
 * These are the actual sources where citizens rate work quality
 */
export async function fetchContractorRatingsFromVerifications(
  contractorIds?: string[]
): Promise<Record<string, ContractorRating>> {
  const result: Record<string, ContractorRating> = {};

  // Fetch milestone verifications with project info
  let verificationQuery = supabase
    .from('milestone_verifications')
    .select(`
      id,
      verification_notes,
      verified_at,
      milestone_id,
      project_milestones!inner(
        project_id,
        projects!inner(
          contractor_id
        )
      )
    `)
    .eq('verification_status', 'approved');

  const { data: verifications, error: vError } = await verificationQuery;
  
  if (vError) {
    console.error('Error fetching verifications for ratings:', vError);
  }

  // Fetch quality checkpoints (citizen reviews)
  let checkpointQuery = supabase
    .from('quality_checkpoints')
    .select(`
      id,
      score,
      created_at,
      project_id,
      projects!inner(
        contractor_id
      )
    `)
    .eq('inspector_type', 'citizen');

  const { data: checkpoints, error: cError } = await checkpointQuery;

  if (cError) {
    console.error('Error fetching quality checkpoints for ratings:', cError);
  }

  // Process milestone verifications
  (verifications || []).forEach((v: any) => {
    const rating = extractRatingFromNotes(v.verification_notes);
    const contractorId = v.project_milestones?.projects?.contractor_id;
    const projectId = v.project_milestones?.project_id;

    if (rating && contractorId) {
      if (!result[contractorId]) {
        result[contractorId] = { averageRating: 0, totalRatings: 0, ratings: [] };
      }
      result[contractorId].ratings.push({
        rating,
        source: 'milestone_verification',
        projectId: projectId || '',
        date: v.verified_at
      });
    }
  });

  // Process quality checkpoints
  (checkpoints || []).forEach((c: any) => {
    const rating = c.score ? scoreToRating(c.score) : null;
    const contractorId = c.projects?.contractor_id;

    if (rating && contractorId) {
      if (!result[contractorId]) {
        result[contractorId] = { averageRating: 0, totalRatings: 0, ratings: [] };
      }
      result[contractorId].ratings.push({
        rating,
        source: 'quality_checkpoint',
        projectId: c.project_id,
        date: c.created_at
      });
    }
  });

  // Calculate averages, filtering by contractorIds if provided
  Object.keys(result).forEach(contractorId => {
    if (contractorIds && !contractorIds.includes(contractorId)) {
      delete result[contractorId];
      return;
    }
    
    const ratings = result[contractorId].ratings;
    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
      result[contractorId].averageRating = Math.round((sum / ratings.length) * 10) / 10;
      result[contractorId].totalRatings = ratings.length;
    }
  });

  return result;
}

/**
 * Gets aggregate rating statistics for all contractors
 * Used for analytics dashboards
 */
export async function getContractorSatisfactionMetrics(): Promise<{
  averageRating: number;
  totalRatings: number;
  ratingDistribution: Record<number, number>;
}> {
  const allRatings = await fetchContractorRatingsFromVerifications();
  
  let totalSum = 0;
  let totalCount = 0;
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  Object.values(allRatings).forEach(contractor => {
    contractor.ratings.forEach(r => {
      totalSum += r.rating;
      totalCount++;
      const roundedRating = Math.round(r.rating);
      if (roundedRating >= 1 && roundedRating <= 5) {
        distribution[roundedRating]++;
      }
    });
  });

  return {
    averageRating: totalCount > 0 ? Math.round((totalSum / totalCount) * 10) / 10 : 0,
    totalRatings: totalCount,
    ratingDistribution: distribution
  };
}
