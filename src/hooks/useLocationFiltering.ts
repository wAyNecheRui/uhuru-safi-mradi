import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentPosition } from '@/utils/geoUtils';

export interface UserLocation {
  latitude: number;
  longitude: number;
  county?: string;
  accuracy?: number;
}

export interface ProblemWithDistance {
  id: string;
  title: string;
  description: string;
  category: string | null;
  priority: string | null;
  status: string | null;
  location: string | null;
  coordinates: string | null;
  county: string | null;
  constituency: string | null;
  ward: string | null;
  estimated_cost: number | null;
  affected_population: number | null;
  priority_score: number | null;
  verified_votes: number | null;
  created_at: string;
  reported_by: string;
  photo_urls: string[] | null;
  distance_km: number | null;
  distance_category: 'urgent' | 'nearby' | 'county' | 'unknown';
}

interface ContractorProfile {
  max_project_capacity: number;
  is_agpo: boolean;
}

interface GovernmentProfile {
  assigned_counties: string[];
}

export const useLocationFiltering = () => {
  const { user } = useAuth();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [problems, setProblems] = useState<ProblemWithDistance[]>([]);
  const [loading, setLoading] = useState(false);

  // Get user's current location with progressive accuracy via unified geoUtils
  const getCurrentLocation = useCallback(async (): Promise<UserLocation> => {
    setIsLocating(true);
    setLocationError(null);
    try {
      const pos = await getCurrentPosition();
      const location: UserLocation = {
        latitude: pos.lat,
        longitude: pos.lon,
        accuracy: pos.accuracy,
      };

      // Try to get county from reverse geocoding
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=10`
        );
        const data = await response.json();
        if (data.address?.county || data.address?.state) {
          location.county = data.address.county || data.address.state;
        }
      } catch (e) {
        console.log('Could not determine county from coordinates');
      }

      setUserLocation(location);
      setIsLocating(false);
      return location;
    } catch (error: any) {
      let errorMessage = 'Unable to get location';
      if (error?.code === 1) errorMessage = 'Location permission denied';
      else if (error?.code === 2) errorMessage = 'Location information unavailable';
      else if (error?.code === 3) errorMessage = 'Location request timed out';
      setLocationError(errorMessage);
      setIsLocating(false);
      throw new Error(errorMessage);
    }
  }, []);

  // Fetch problems with distance filtering (for citizens)
  const fetchProblemsWithDistance = useCallback(async (
    lat: number,
    lon: number,
    maxDistanceKm: number = 20
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_problems_with_distance', {
        user_lat: lat,
        user_lon: lon,
        max_distance_km: maxDistanceKm,
      });

      if (error) throw error;

      setProblems((data || []) as ProblemWithDistance[]);
      return data as ProblemWithDistance[];
    } catch (error) {
      console.error('Error fetching problems:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if user can vote on a problem (within 50km)
  const canVote = useCallback(async (reportId: string): Promise<boolean> => {
    if (!userLocation) return true; // Allow if no location

    try {
      const { data, error } = await supabase.rpc('can_user_vote', {
        user_lat: userLocation.latitude,
        user_lon: userLocation.longitude,
        report_id: reportId,
      });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking vote eligibility:', error);
      return true; // Allow by default on error
    }
  }, [userLocation]);

  // Check if user can verify a problem (within 10km)
  const canVerify = useCallback(async (reportId: string): Promise<boolean> => {
    if (!userLocation) return true; // Allow if no location

    try {
      const { data, error } = await supabase.rpc('can_user_verify', {
        user_lat: userLocation.latitude,
        user_lon: userLocation.longitude,
        report_id: reportId,
      });

      if (error) throw error;
      return data as boolean;
    } catch (error) {
      console.error('Error checking verify eligibility:', error);
      return true; // Allow by default on error
    }
  }, [userLocation]);

  // Get contractor's filtered projects
  const getContractorProjects = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.rpc('get_contractor_projects', {
        contractor_user_id: user.id,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching contractor projects:', error);
      return [];
    }
  }, [user]);

  // Get government's filtered problems
  const getGovernmentProblems = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase.rpc('get_government_problems', {
        gov_user_id: user.id,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching government problems:', error);
      return [];
    }
  }, [user]);

  // Update contractor profile with registered counties and capacity
  const updateContractorSettings = useCallback(async (
    settings: Partial<ContractorProfile>
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('contractor_profiles')
        .update(settings)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating contractor settings:', error);
      return false;
    }
  }, [user]);

  // Update government profile with assigned counties
  const updateGovernmentSettings = useCallback(async (
    settings: Partial<GovernmentProfile>
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('government_profiles')
        .update(settings)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating government settings:', error);
      return false;
    }
  }, [user]);

  // Calculate distance category for display
  const getDistanceCategory = (distanceKm: number | null): {
    label: string;
    color: string;
    icon: string;
  } => {
    if (distanceKm === null) {
      return { label: 'Unknown', color: 'gray', icon: '📍' };
    }
    if (distanceKm <= 5) {
      return { label: 'Urgent (0-5km)', color: 'red', icon: '🔴' };
    }
    if (distanceKm <= 10) {
      return { label: 'Nearby (5-10km)', color: 'yellow', icon: '🟡' };
    }
    return { label: 'County-wide', color: 'blue', icon: '🔵' };
  };

  // Format distance for display
  const formatDistance = (distanceKm: number | null): string => {
    if (distanceKm === null) return 'Distance unknown';
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m away`;
    return `${distanceKm.toFixed(1)}km away`;
  };

  return {
    userLocation,
    locationError,
    isLocating,
    problems,
    loading,
    getCurrentLocation,
    fetchProblemsWithDistance,
    canVote,
    canVerify,
    getContractorProjects,
    getGovernmentProblems,
    updateContractorSettings,
    updateGovernmentSettings,
    getDistanceCategory,
    formatDistance,
  };
};

// Re-export from canonical source for backward compatibility
export { KENYA_COUNTIES } from '@/constants/kenyaAdministrativeUnits';
