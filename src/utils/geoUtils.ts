import { supabase } from '@/integrations/supabase/client';

/**
 * Haversine distance calculation (client-side, for display purposes)
 */
export function haversineDistanceKm(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Server-side milestone proximity check (10km) */
export async function canVerifyMilestone(
  userLat: number, userLon: number, milestoneId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_verify_milestone', {
    user_lat: userLat,
    user_lon: userLon,
    p_milestone_id: milestoneId,
  });
  if (error) {
    console.error('Milestone proximity check error:', error);
    return true; // graceful fallback
  }
  return data as boolean;
}

/** Server-side contractor county matching check */
export async function canContractorBid(
  contractorId: string, reportId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_contractor_bid', {
    p_contractor_id: contractorId,
    p_report_id: reportId,
  });
  if (error) {
    console.error('Contractor bid eligibility error:', error);
    return true;
  }
  return data as boolean;
}

/** Check if browser has location permissions explicitly granted */
export async function checkLocationPermission(): Promise<PermissionState | 'unsupported'> {
  if (!navigator.permissions || !navigator.permissions.query) return 'unsupported';
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return result.state;
  } catch (e) {
    return 'unsupported';
  }
}

/** Get user's current GPS position with automatic coarse fallback */
export async function getCurrentPosition(): Promise<{ lat: number; lon: number; accuracy: number; isFallback?: boolean }> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation not supported');
  }

  // Stage 1: Try High Accuracy (GPS/Satellite)
  try {
    return await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 } // 8s timeout for high accuracy
      );
    });
  } catch (error: any) {
    // If it was a USER denial, don't retry coarse (it will fail too)
    if (error.code === 1) throw error;

    console.log('[Geo] High accuracy failed/timed out, falling back to coarse resolution...');

    // Stage 2: Coarse Fallback (WiFi/Cell/Network) - Much faster and more reliable indoors
    return await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          isFallback: true
        }),
        (err) => reject(err),
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      );
    });
  }
}

