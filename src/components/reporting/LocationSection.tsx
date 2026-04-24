import React, { useEffect, useState } from 'react';
import { Map, MapPin, Loader2, CheckCircle, AlertTriangle, RefreshCw, Plane } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReportData } from '@/types/problemReporting';
import { getFullLocationByCoordinates } from '@/constants/kenyaAdminData';
import { useProfile } from '@/hooks/useProfile';
import { findNearestCounty } from '@/constants/countyCentroids';

interface LocationSectionProps {
  reportData: ReportData;
  onInputChange: (field: keyof ReportData, value: string) => void;
  onLocationDataChange?: (data: { county: string; constituency: string; ward: string; gpsVerified: boolean; coordinates?: string }) => void;
}

type GpsState = 'detecting' | 'success' | 'error' | 'denied';

const LocationSection = ({ reportData, onInputChange, onLocationDataChange }: LocationSectionProps) => {
  const { userProfile } = useProfile();
  const [gpsState, setGpsState] = useState<GpsState>('detecting');
  const [errorMsg, setErrorMsg] = useState('');

  const registeredCounty = userProfile?.county?.trim() || '';
  const detectedCounty = reportData.county?.trim() || '';
  const isOutOfCounty =
    !!registeredCounty &&
    !!detectedCounty &&
    registeredCounty.toLowerCase() !== detectedCounty.toLowerCase();

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGpsState('error');
      setErrorMsg('GPS is not supported on this device.');
      return;
    }

    setGpsState('detecting');
    setErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`, {
            headers: { 'Accept-Language': 'en-US,en;q=0.9' }
          });

          if (!response.ok) throw new Error('OSM Reverse Geocoding Failed');

          const data = await response.json();
          const address = data.address || {};

          let countyRaw = address.county || address.state || address.region || '';
          const constituency = address.suburb || address.city_district || address.town || address.city || '';
          const ward = address.neighbourhood || address.village || address.residential || '';

          // Normalize 'Nairobi County' to 'Nairobi'
          let county = countyRaw.replace(/county/i, '').trim();

          // Centroid fallback: if OSM didn't give us a county, snap to the nearest Kenyan county.
          // This guarantees every GPS point in Kenya resolves to a valid county.
          if (!county) {
            const nearest = findNearestCounty(latitude, longitude);
            if (nearest) county = nearest;
          }

          if (county) {
            const locationString = [ward, constituency, `${county} County`].filter(Boolean).join(', ');
            onInputChange('location', locationString);
            onInputChange('coordinates', coords);

            if (onLocationDataChange) {
              onLocationDataChange({
                county,
                constituency,
                ward,
                gpsVerified: true,
                coordinates: coords,
              });
            }
            setGpsState('success');
          } else {
            // GPS is outside Kenya — block per policy
            onInputChange('coordinates', coords);
            setGpsState('error');
            setErrorMsg('Your GPS location is outside Kenya. Reports must be filed from within Kenya.');
          }
        } catch (err) {
          console.error('OSM Error:', err);
          // Network failure: still try the offline centroid resolver so reporting works on poor connections
          const nearest = findNearestCounty(latitude, longitude);
          if (nearest) {
            const locationString = `${nearest} County`;
            onInputChange('location', locationString);
            onInputChange('coordinates', coords);
            if (onLocationDataChange) {
              onLocationDataChange({
                county: nearest,
                constituency: '',
                ward: '',
                gpsVerified: true,
                coordinates: coords,
              });
            }
            setGpsState('success');
          } else {
            onInputChange('coordinates', coords);
            setGpsState('error');
            setErrorMsg('Network error while detecting location and your GPS appears to be outside Kenya.');
          }
        }
      },
      (error) => {
        console.error('GPS Error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsState('denied');
          setErrorMsg('Location access denied. Please enable location permissions in your browser/phone settings.');
        } else if (error.code === error.TIMEOUT) {
          setGpsState('error');
          setErrorMsg('Location detection timed out. Please try again.');
        } else {
          setGpsState('error');
          setErrorMsg('Unable to detect your location. Please try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const getMapUrl = () => {
    if (!reportData.coordinates) return null;
    const [lat, lng] = reportData.coordinates.split(',').map(s => s.trim());
    return `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lng) - 0.005}%2C${parseFloat(lat) - 0.005}%2C${parseFloat(lng) + 0.005}%2C${parseFloat(lat) + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-foreground">
        Problem Location <span className="text-destructive">*</span>
      </label>

      {/* GPS Detection Status */}
      <div className="p-3 rounded-lg border bg-muted/50">
        {gpsState === 'detecting' && (
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <div>
              <p className="text-sm font-medium">Detecting your location...</p>
              <p className="text-xs text-muted-foreground">Please allow location access when prompted</p>
            </div>
          </div>
        )}

        {gpsState === 'success' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Location detected successfully</span>
              <Badge variant="outline" className="ml-auto text-[10px] border-green-300 text-green-700 dark:text-green-400">GPS Verified</Badge>
            </div>

            {/* Location details read-only */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {reportData.county && (
                <div className="p-2 bg-background rounded border">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">County</p>
                  <p className="text-sm font-semibold">{reportData.county}</p>
                </div>
              )}
              {reportData.constituency && (
                <div className="p-2 bg-background rounded border">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Constituency</p>
                  <p className="text-sm font-semibold">{reportData.constituency}</p>
                </div>
              )}
              {reportData.ward && (
                <div className="p-2 bg-background rounded border">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Ward</p>
                  <p className="text-sm font-semibold">{reportData.ward}</p>
                </div>
              )}
            </div>

            {isOutOfCounty && (
              <Alert className="border-primary/40 bg-primary/5">
                <Plane className="h-4 w-4 text-primary" />
                <AlertDescription className="text-xs">
                  <strong>Reporting away from home.</strong> You're registered in <strong>{registeredCounty}</strong> but your GPS shows <strong>{detectedCounty}</strong>. This report will be tagged to <strong>{detectedCounty}</strong> so the right county officials see it. You won't be able to vote on it (only {detectedCounty} residents can). Limit: 3 cross-county reports per day.
                </AlertDescription>
              </Alert>
            )}

            <Button variant="ghost" size="sm" onClick={detectLocation} className="text-xs text-muted-foreground">
              <RefreshCw className="h-3 w-3 mr-1" />
              Re-detect location
            </Button>
          </div>
        )}

        {(gpsState === 'error' || gpsState === 'denied') && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Location detection failed</span>
            </div>
            <p className="text-xs text-muted-foreground">{errorMsg}</p>
            <Button variant="outline" size="sm" onClick={detectLocation}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* GPS Coordinates & Map */}
      {reportData.coordinates && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
            <Map className="h-4 w-4 text-blue-600" />
            <code className="text-sm font-mono">{reportData.coordinates}</code>
          </div>

          <div className="border rounded-lg overflow-hidden bg-muted">
            <iframe
              src={getMapUrl() || ''}
              width="100%"
              height="200"
              style={{ border: 0 }}
              loading="lazy"
              title="Problem Location Map"
              className="rounded-lg"
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            📍 Your report will be tagged to this location
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationSection;
