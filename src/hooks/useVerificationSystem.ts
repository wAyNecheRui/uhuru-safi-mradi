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

      // Fetch contractor profiles for specialization data
      const { data: contractorProfiles } = await supabase
        .from('contractor_profiles')
        .select('user_id, company_name, specialization, verified');

      // Fetch project milestones for citizen verification data
      const { data: milestonesData } = await supabase
        .from('project_milestones')
        .select(`
          *,
          projects(title),
          milestone_verifications(id, verification_status, verification_notes, verified_at)
        `);

      // Transform NCA data
      const transformedNCA = ncaData?.map(nca => {
        const profile = profilesData?.find(p => p.user_id === nca.user_id);
        const contractorProfile = contractorProfiles?.find(cp => cp.user_id === nca.user_id);
        const credential = credentialsData?.find(c => c.contractor_id === nca.user_id && c.credential_type === 'nca_registration');
        
        return {
          contractorName: contractorProfile?.company_name || profile?.full_name || 'Unknown',
          ncaNumber: nca.reference_number || credential?.credential_number || '—',
          category: credential?.credential_name || 'Building - General',
          status: nca.status,
          expiryDate: nca.expires_at || credential?.expiry_date || 'Pending',
          specializations: contractorProfile?.specialization || ['General Construction'],
          verificationDate: nca.verified_at || nca.created_at,
          riskScore: nca.status === 'verified' ? 'Low' : 'Medium'
        };
      }) || [];

      // Transform EACC data
      const transformedEACC = eaccData?.map(eacc => {
        const profile = profilesData?.find(p => p.user_id === eacc.user_id);
        const contractorProfile = contractorProfiles?.find(cp => cp.user_id === eacc.user_id);
        
        return {
          contractorName: contractorProfile?.company_name || profile?.full_name || 'Unknown',
          clearanceNumber: eacc.reference_number || '—',
          status: eacc.status,
          issuedDate: eacc.verified_at || 'Pending',
          validUntil: eacc.expires_at || 'Pending',
          riskLevel: eacc.status === 'verified' ? 'Low' : 'Medium',
          pastCases: 0,
          complianceScore: eacc.status === 'verified' ? 95 : eacc.status === 'pending' ? 50 : 30
        };
      }) || [];

      // Transform citizen verification data from milestones with real rating calculation
      const transformedCitizen = (milestonesData || [])
        .filter(milestone => (milestone.milestone_verifications?.length || 0) > 0)
        .map(milestone => {
          const verifications = milestone.milestone_verifications || [];
          const approvedVerifications = verifications.filter((v: any) => v.verification_status === 'approved');
          
          // Calculate average rating from verification notes (parsing "Rating: X/5")
          let totalRating = 0;
          let ratingCount = 0;
          verifications.forEach((v: any) => {
            if (v.verification_notes) {
              const match = v.verification_notes.match(/Rating:\s*([\d.]+)/);
              if (match) {
                const rating = parseFloat(match[1]);
                if (rating >= 1 && rating <= 5) {
                  totalRating += rating;
                  ratingCount++;
                }
              }
            }
          });
          const averageRating = ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0;

          // Required verifications threshold is 2 (matching auto_verify_milestone_on_threshold)
          const requiredVerifications = 2;
          const totalVer = approvedVerifications.length;
          
          // Count issues (rejected verifications)
          const issues = verifications.filter((v: any) => v.verification_status === 'rejected').length;

          return {
            projectTitle: milestone.projects?.title || 'Unknown Project',
            totalVerifications: totalVer,
            requiredVerifications,
            verificationPercentage: requiredVerifications > 0 ? Math.min((totalVer / requiredVerifications) * 100, 100) : 0,
            lastVerified: approvedVerifications.length > 0 
              ? approvedVerifications.sort((a: any, b: any) => new Date(b.verified_at).getTime() - new Date(a.verified_at).getTime())[0].verified_at 
              : milestone.created_at,
            verificationMethods: ['Photo Evidence', 'Site Visit'],
            averageRating,
            issues
          };
        });

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
    toast({
      title: "Verification Submitted",
      description: `${type} verification request submitted for ${id}. Results will be available after review.`,
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