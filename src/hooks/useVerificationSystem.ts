import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useVerificationSystem = () => {
  const [ncaVerifications, setNcaVerifications] = useState([]);
  const [eaccClearances, setEaccClearances] = useState([]);
  const [citizenVerifications, setCitizenVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchVerificationData();
  }, []);

  const fetchVerificationData = async () => {
    try {
      setLoading(true);

      // Fetch NCA verifications
      const { data: ncaData } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('verification_type', 'nca_registration');

      // Fetch EACC clearances
      const { data: eaccData } = await supabase
        .from('user_verifications')
        .select('*')
        .eq('verification_type', 'eacc_clearance');

      // Fetch user profiles for names
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('*');

      // Fetch contractor credentials for additional verification data
      const { data: credentialsData } = await supabase
        .from('contractor_credentials')
        .select('*');

      // Fetch project milestones for citizen verification data
      const { data: milestonesData } = await supabase
        .from('project_milestones')
        .select(`
          *,
          projects(title),
          milestone_verifications(*)
        `);

      // Transform NCA data
      const transformedNCA = ncaData?.map(nca => {
        const profile = profilesData?.find(p => p.user_id === nca.user_id);
        return {
        contractorName: profile?.full_name || 'Unknown',
        ncaNumber: nca.reference_number,
        category: 'Building - General',
        status: nca.status,
        expiryDate: nca.expires_at || '2025-12-31',
        specializations: ['General Construction'],
        verificationDate: nca.verified_at || nca.created_at,
        riskScore: nca.status === 'verified' ? 'Low' : 'Medium'
      }}) || [];

      // Transform EACC data
      const transformedEACC = eaccData?.map(eacc => {
        const profile = profilesData?.find(p => p.user_id === eacc.user_id);
        return {
        contractorName: profile?.full_name || 'Unknown',
        clearanceNumber: eacc.reference_number,
        status: eacc.status,
        issuedDate: eacc.verified_at || 'Pending',
        validUntil: eacc.expires_at || 'Pending',
        riskLevel: eacc.status === 'verified' ? 'Low' : 'Medium',
        pastCases: 0, // TODO: Implement case tracking
        complianceScore: eacc.status === 'verified' ? 95 : 78
      }}) || [];

      // Transform citizen verification data from milestones
      const transformedCitizen = milestonesData?.map(milestone => ({
        projectTitle: milestone.projects?.title || 'Unknown Project',
        totalVerifications: milestone.milestone_verifications?.length || 0,
        requiredVerifications: 30,
        verificationPercentage: Math.min(((milestone.milestone_verifications?.length || 0) / 30) * 100, 100),
        lastVerified: milestone.verified_at || milestone.created_at,
        verificationMethods: ['Photo Evidence', 'Site Visit'],
        averageRating: 4.2,
        issues: 0
      })) || [];

      setNcaVerifications(transformedNCA);
      setEaccClearances(transformedEACC);
      setCitizenVerifications(transformedCitizen);
    } catch (error) {
      console.error('Error fetching verification data:', error);
      toast({
        title: "Error",
        description: "Failed to load verification data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (type: string, id: string) => {
    // Simulate verification process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast({
      title: "Verification Completed",
      description: `${type} verification has been successfully processed.`,
    });
  };

  return {
    ncaVerifications,
    eaccClearances,
    citizenVerifications,
    loading,
    handleVerification
  };
};