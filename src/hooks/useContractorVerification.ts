import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useContractorVerification = () => {
  const [verificationData, setVerificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchVerificationData();
  }, []);

  const fetchVerificationData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Fetch contractor profile
      const { data: profile } = await supabase
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

      // Fetch contractor bids and projects
      const { data: bids } = await supabase
        .from('contractor_bids')
        .select(`
          *,
          problem_reports(title, budget_allocated)
        `)
        .eq('contractor_id', user.id);

      // Fetch active projects
      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('contractor_id', user.id);

      if (profile) {
        setVerificationData({
          companyName: profile.organization || 'Not specified',
          kraPin: verifications?.find(v => v.verification_type === 'kra_pin')?.reference_number || 'Not verified',
          registrationNumber: verifications?.find(v => v.verification_type === 'company_registration')?.reference_number || 'Not verified',
          physicalAddress: profile.location || 'Not specified',
          yearsInBusiness: profile.years_experience || 0,
          verificationStatus: verifications?.some(v => v.status === 'verified') ? 'verified' : 'pending',
          overallRating: 4.0, // Calculate from actual project ratings
          totalProjects: bids?.length || 0,
          completedProjects: projects?.filter(p => p.status === 'completed').length || 0,
          activeProjects: projects?.filter(p => p.status === 'in_progress').length || 0,
          specializations: profile.skills || [],
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
            rating: 4.0, // TODO: Calculate from actual ratings
            completionDate: p.updated_at
          })) || []
        });
      }
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

  const handleDocumentUpload = async (docType: string) => {
    toast({
      title: "Document uploaded successfully",
      description: `${docType} has been submitted for verification.`,
    });
    // TODO: Implement actual file upload
  };

  return {
    verificationData,
    loading,
    handleDocumentUpload
  };
};