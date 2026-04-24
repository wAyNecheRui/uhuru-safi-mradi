// Approximate geographic centers for Kenya's 47 counties.
// Used as a fallback when a project/report has no real GPS coordinates.
export const COUNTY_CENTROIDS: Record<string, [number, number]> = {
  'nairobi': [-1.2921, 36.8219],
  'mombasa': [-4.0435, 39.6682],
  'kisumu': [-0.1022, 34.7617],
  'nakuru': [-0.3031, 36.0800],
  'eldoret': [0.5143, 35.2698],
  'nyeri': [-0.4197, 36.9511],
  'machakos': [-1.5177, 37.2634],
  'kiambu': [-1.1714, 36.8356],
  'kakamega': [0.2827, 34.7519],
  'uasin gishu': [0.5143, 35.2698],
  'kilifi': [-3.6305, 39.8499],
  'kwale': [-4.1816, 39.4526],
  'garissa': [-0.4532, 39.6461],
  'wajir': [1.7471, 40.0573],
  'mandera': [3.9373, 41.8569],
  'marsabit': [2.3284, 37.9900],
  'isiolo': [0.3546, 37.5822],
  'meru': [0.0480, 37.6559],
  'tharaka-nithi': [-0.3064, 37.7846],
  'embu': [-0.5389, 37.4596],
  'kitui': [-1.3667, 38.0167],
  'makueni': [-1.8043, 37.6207],
  'nyandarua': [-0.1833, 36.5167],
  'kirinyaga': [-0.5000, 37.2833],
  "murang'a": [-0.7833, 37.1500],
  'turkana': [3.3122, 35.5658],
  'west pokot': [1.6189, 35.1957],
  'samburu': [1.1147, 36.9544],
  'trans nzoia': [1.0167, 35.0167],
  'trans-nzoia': [1.0167, 35.0167],
  'baringo': [0.4911, 35.7426],
  'elgeyo-marakwet': [0.6833, 35.5000],
  'nandi': [0.1833, 35.1500],
  'laikipia': [0.3606, 36.7819],
  'kajiado': [-2.0981, 36.7820],
  'kericho': [-0.3692, 35.2863],
  'bomet': [-0.7819, 35.3428],
  'narok': [-1.0833, 35.8667],
  'bungoma': [0.5636, 34.5583],
  'busia': [0.4608, 34.1108],
  'siaya': [-0.0617, 34.2422],
  'homa bay': [-0.5273, 34.4571],
  'migori': [-1.0634, 34.4731],
  'kisii': [-0.6817, 34.7667],
  'nyamira': [-0.5633, 34.9347],
  'vihiga': [0.0833, 34.7167],
  'lamu': [-2.2717, 40.9020],
  'taita-taveta': [-3.3961, 38.5566],
  'tana river': [-1.5000, 40.0333],
};

export const KENYA_CENTER: [number, number] = [-0.0236, 37.9062];

export const getCountyCentroid = (county: string | null | undefined): [number, number] => {
  if (!county) return KENYA_CENTER;
  const key = county.toLowerCase().trim();
  return COUNTY_CENTROIDS[key] || KENYA_CENTER;
};

/**
 * Title-case a county key from the centroid map (e.g. "trans nzoia" -> "Trans Nzoia").
 */
const titleCaseCounty = (key: string): string =>
  key
    .split(' ')
    .map((part) =>
      part
        .split('-')
        .map((p) => (p.length ? p[0].toUpperCase() + p.slice(1) : p))
        .join('-')
    )
    .join(' ');

/**
 * Find the nearest Kenyan county for a given GPS coordinate using centroid distance.
 * Returns the county name in display form, or null if input is invalid.
 * Used as the offline GPS -> county resolver for cross-county reporting.
 */
export const findNearestCounty = (
  lat: number | null | undefined,
  lon: number | null | undefined
): string | null => {
  if (lat === null || lat === undefined || lon === null || lon === undefined) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  // Sanity check: roughly within Kenya's bounding box (with margin)
  if (lat < -6 || lat > 6 || lon < 32 || lon > 43) return null;

  let bestKey: string | null = null;
  let bestDist = Infinity;

  for (const [key, [cLat, cLon]] of Object.entries(COUNTY_CENTROIDS)) {
    // Squared planar distance is fine for nearest-neighbour ranking
    const dLat = lat - cLat;
    const dLon = lon - cLon;
    const d = dLat * dLat + dLon * dLon;
    if (d < bestDist) {
      bestDist = d;
      bestKey = key;
    }
  }

  if (!bestKey) return null;
  // Prefer canonical hyphenated forms (e.g. "trans-nzoia") over duplicates
  if (bestKey === 'trans nzoia') bestKey = 'trans-nzoia';
  return titleCaseCounty(bestKey);
};

// Parse a Postgres point type "(lng,lat)" or various lat,lng formats into [lat, lng]
export const parseGpsPoint = (raw: unknown): [number, number] | null => {
  if (!raw) return null;
  const str = String(raw).trim();
  if (!str) return null;

  // Postgres point format: "(lng,lat)" — note: pg point order is (x,y) where x=lng, y=lat
  const pgMatch = str.match(/^\(?\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\)?$/);
  if (pgMatch) {
    const a = parseFloat(pgMatch[1]);
    const b = parseFloat(pgMatch[2]);
    // Heuristic: Kenya lat range ~ -5 to 5, lng range ~ 33 to 42
    // If first value is in lat range and second in lng range → "lat,lng"
    // If first in lng range and second in lat range → "lng,lat" (pg point default)
    if (Math.abs(a) <= 10 && b >= 30 && b <= 45) return [a, b]; // lat,lng
    if (a >= 30 && a <= 45 && Math.abs(b) <= 10) return [b, a]; // lng,lat (pg)
    // Fallback: assume lat,lng
    if (a >= -90 && a <= 90 && b >= -180 && b <= 180) return [a, b];
  }
  return null;
};
