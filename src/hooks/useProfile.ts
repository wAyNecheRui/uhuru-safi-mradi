import { useState, useEffect } from 'react';
import { ProfileService, type UserProfile, type ContractorProfile, type GovernmentProfile } from '@/services/ProfileService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useProfile = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [contractorProfile, setContractorProfile] = useState<ContractorProfile | null>(null);
  const [governmentProfile, setGovernmentProfile] = useState<GovernmentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadProfiles();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const profile = await ProfileService.getUserProfile();
      setUserProfile(profile);

      // Load role-specific profiles
      const contractor = await ProfileService.getContractorProfile();
      setContractorProfile(contractor);

      const government = await ProfileService.getGovernmentProfile();
      setGovernmentProfile(government);
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const result = await ProfileService.updateUserProfile(updates);
    if (result.success) {
      await loadProfiles();
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
      await loadProfiles();
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
      await loadProfiles();
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
