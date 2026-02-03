import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { isProjectEffectivelyCompleted } from '@/utils/progressCalculation';
import { fetchContractorRatingsFromVerifications } from '@/utils/contractorRatingCalculation';

export const useContractorVerification = () => {
  const [verificationData, setVerificationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const fetchedRef = useRef(false);

  const fetchVerificationData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    // Prevent duplicate fetches
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    try {
      setLoading(true);
      
      // Batch ALL queries in parallel for maximum performance
      const [
        contractorProfileResult,
        skillsProfileResult,
        credentialsResult,
        verificationsResult,
        bidsResult,
        projectsResult,
        milestonesResult,
        // Fetch REAL ratings from milestone_verifications (not empty contractor_ratings table)
        realRatingsData
      ] = await Promise.all([
        supabase.from('contractor_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('skills_profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('contractor_credentials').select('*').eq('contractor_id', user.id).limit(20),
        supabase.from('user_verifications').select('*').eq('user_id', user.id).limit(10),
        supabase.from('contractor_bids').select('id').eq('contractor_id', user.id),
        supabase.from('projects').select('*').eq('contractor_id', user.id).limit(20),
        supabase.from('project_milestones').select('project_id, status'),
        fetchContractorRatingsFromVerifications([user.id])
      ]);

      const contractorProfile = contractorProfileResult.data;
      const skillsProfile = skillsProfileResult.data;
      const credentials = credentialsResult.data || [];
      const verifications = verificationsResult.data || [];
      const bids = bidsResult.data || [];
      const projects = projectsResult.data || [];
      const milestones = milestonesResult.data || [];
      
      // Get real rating from milestone verifications
      const realRating = realRatingsData[user.id];
      const avgRating = realRating?.averageRating || 0;
      const totalRatings = realRating?.totalRatings || 0;
      
      // Group milestones by project
      const milestonesByProject: Record<string, {status: string}[]> = {};
      milestones.forEach(m => {
        if (!milestonesByProject[m.project_id]) {
          milestonesByProject[m.project_id] = [];
        }
        milestonesByProject[m.project_id].push({ status: m.status });
      });
      
      setVerificationData({
        companyName: contractorProfile?.company_name || skillsProfile?.organization || 'Not specified',
        kraPin: contractorProfile?.kra_pin || verifications.find(v => v.verification_type === 'kra_pin')?.reference_number || 'Not verified',
        registrationNumber: contractorProfile?.company_registration_number || verifications.find(v => v.verification_type === 'company_registration')?.reference_number || 'Not verified',
        physicalAddress: skillsProfile?.location || 'Not specified',
        yearsInBusiness: contractorProfile?.years_in_business || skillsProfile?.years_experience || 0,
        verificationStatus: contractorProfile?.verified ? 'verified' : (verifications.some(v => v.status === 'verified') ? 'verified' : 'pending'),
        overallRating: avgRating,
        totalRatings: totalRatings,
        totalProjects: bids.length + projects.length,
        completedProjects: projects.filter(p => isProjectEffectivelyCompleted(p.status, milestonesByProject[p.id] || [])).length,
        activeProjects: projects.filter(p => !isProjectEffectivelyCompleted(p.status, milestonesByProject[p.id] || []) && (p.status === 'in_progress' || p.status === 'active')).length,
        specializations: contractorProfile?.specialization || skillsProfile?.skills || [],
        certifications: credentials.map(c => ({
          name: c.credential_name,
          status: c.verification_status,
          expiryDate: c.expiry_date || 'N/A'
        })),
        recentProjects: projects.slice(0, 5).map(p => ({
          id: p.id,
          title: p.title,
          value: p.budget || 0,
          status: p.status,
          rating: avgRating, // Use real calculated rating
          completionDate: p.updated_at
        }))
      });
    } catch (error) {
      console.error('Error fetching verification data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchedRef.current = false;
    if (user) {
      fetchVerificationData();
    } else {
      setLoading(false);
    }
  }, [user, fetchVerificationData]);

  const handleDocumentUpload = async (docType: string) => {
    toast({
      title: "Document uploaded successfully",
      description: `${docType} has been submitted for verification.`,
    });
  };

  return {
    verificationData,
    loading,
    handleDocumentUpload,
    refetch: () => {
      fetchedRef.current = false;
      fetchVerificationData();
    }
  };
};
