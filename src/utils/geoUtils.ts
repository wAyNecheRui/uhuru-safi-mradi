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
    throw new Error('Geolocation is not supported by your browser.');
  }

  // Secure-context check: geolocation requires HTTPS (or localhost) in modern browsers.
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    const err: any = new Error('Geolocation requires a secure (HTTPS) connection.');
    err.code = 'INSECURE_CONTEXT';
    throw err;
  }

  const requestPosition = (options: PositionOptions, isFallback = false) => new Promise<{ lat: number; lon: number; accuracy: number; isFallback?: boolean }>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        ...(isFallback ? { isFallback: true } : {}),
      }),
      (err) => reject(err),
      options
    );
  });

  const attempts: Array<{ options: PositionOptions; isFallback?: boolean; label: string }> = [
    {
      label: 'high accuracy GPS',
      options: { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    },
    {
      label: 'coarse network',
      options: { enableHighAccuracy: false, timeout: 12000, maximumAge: 60000 },
      isFallback: true,
    },
    {
      label: 'cached network',
      options: { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
      isFallback: true,
    },
  ];

  let lastError: any = null;

  for (const attempt of attempts) {
    try {
      return await requestPosition(attempt.options, attempt.isFallback);
    } catch (error: any) {
      lastError = error;
      if (error?.code === 1) throw error;
      console.log(`[Geo] ${attempt.label} lookup failed, trying next strategy...`, error);
    }
  }

  throw lastError ?? new Error('Unable to determine your location.');
}

