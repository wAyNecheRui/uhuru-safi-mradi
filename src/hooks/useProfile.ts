import { useState, useEffect, useCallback } from 'react';
import { ProfileService, type UserProfile, type ContractorProfile, type GovernmentProfile } from '@/services/ProfileService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useProfile = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [contractorProfile, setContractorProfile] = useState<ContractorProfile | null>(null);
  const [governmentProfile, setGovernmentProfile] = useState<GovernmentProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const loadProfiles = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Load user profile first (fast)
      const profile = await ProfileService.getUserProfile();
      setUserProfile(profile);

      // Only load role-specific profiles based on user type (lazy load)
      if (user.user_type === 'contractor') {
        const contractor = await ProfileService.getContractorProfile();
        setContractorProfile(contractor);
      } else if (user.user_type === 'government') {
        const government = await ProfileService.getGovernmentProfile();
        setGovernmentProfile(government);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [user?.id, user?.user_type]);

  useEffect(() => {
    if (user?.id && !initialized) {
      loadProfiles();
    } else if (!user?.id) {
      setInitialized(false);
      setUserProfile(null);
      setContractorProfile(null);
      setGovernmentProfile(null);
    }
  }, [user?.id, initialized, loadProfiles]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const result = await ProfileService.updateUserProfile(updates);
    if (result.success) {
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Profile updated successfully');
      return true;
    } else {
      toast.error(result.error || 'Failed to update profile');
      return false;
    }
  };

  const updateContractorProfile = async (updates: Partial<ContractorProfile>) => {
    const result = await ProfileService.upsertContractorProfile(updates);
    if (result.success) {
      setContractorProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Contractor profile updated successfully');
      return true;
    } else {
      toast.error(result.error || 'Failed to update contractor profile');
      return false;
    }
  };

  const updateGovernmentProfile = async (updates: Partial<GovernmentProfile>) => {
    const result = await ProfileService.upsertGovernmentProfile(updates);
    if (result.success) {
      setGovernmentProfile(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Government profile updated successfully');
      return true;
    } else {
      toast.error(result.error || 'Failed to update government profile');
      return false;
    }
  };

  return {
    userProfile,
    contractorProfile,
    governmentProfile,
    loading,
    updateProfile,
    updateContractorProfile,
    updateGovernmentProfile,
    refreshProfiles: loadProfiles,
  };
};
