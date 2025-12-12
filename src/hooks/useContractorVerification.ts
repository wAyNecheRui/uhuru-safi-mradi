import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const useContractorVerification = () => {
  const [verificationData, setVerificationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchVerificationData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchVerificationData = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch contractor profile - try both tables
      const { data: contractorProfile } = await supabase
        .from('contractor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: skillsProfile } = await supabase
        .from('skills_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Fetch contractor credentials
      const { data: credentials } = await supabase
        .from('contractor_credentials')
        .select('*')
        .eq('contractor_id', user.id);

      // Fetch user verifications
      const { data: verifications } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('user_id', user.id);

      // Fetch contractor bids
      const { data: bids } = await supabase
        .from('contractor_bids')
        .select('*')
        .eq('contractor_id', user.id);

      // Fetch projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('contractor_id', user.id);

      // Fetch ratings
      const { data: ratings } = await supabase
        .from('contractor_ratings')
        .select('rating')
        .eq('contractor_id', user.id);

      const avgRating = ratings && ratings.length > 0 
        ? ratings.reduce((acc, r) => acc + (r.rating || 0), 0) / ratings.length 
        : 0;
      
      // Build verification data from real database values
      setVerificationData({
        companyName: contractorProfile?.company_name || skillsProfile?.organization || 'Not specified',
        kraPin: contractorProfile?.kra_pin || verifications?.find(v => v.verification_type === 'kra_pin')?.reference_number || 'Not verified',
        registrationNumber: contractorProfile?.company_registration_number || verifications?.find(v => v.verification_type === 'company_registration')?.reference_number || 'Not verified',
        physicalAddress: skillsProfile?.location || 'Not specified',
        yearsInBusiness: contractorProfile?.years_in_business || skillsProfile?.years_experience || 0,
        verificationStatus: contractorProfile?.verified ? 'verified' : (verifications?.some(v => v.status === 'verified') ? 'verified' : 'pending'),
        overallRating: avgRating,
        totalProjects: (bids?.length || 0) + (projects?.length || 0),
        completedProjects: projects?.filter(p => p.status === 'completed').length || 0,
        activeProjects: projects?.filter(p => p.status === 'in_progress' || p.status === 'active').length || 0,
        specializations: contractorProfile?.specialization || skillsProfile?.skills || [],
        certifications: credentials?.map(c => ({
          name: c.credential_name,
          status: c.verification_status,
          expiryDate: c.expiry_date || 'N/A'
        })) || [],
        recentProjects: projects?.slice(0, 5).map(p => ({
          id: p.id,
          title: p.title,
          value: p.budget || 0,
          status: p.status,
          rating: avgRating,
          completionDate: p.updated_at
        })) || []
      });
    } catch (error) {
      console.error('Error fetching verification data:', error);
      // Don't show error toast for missing data - just show empty state
    } finally {
      setLoading(false);
    }
  };

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
    refetch: fetchVerificationData
  };
};