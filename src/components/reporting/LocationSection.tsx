import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2, Map, CheckCircle } from 'lucide-react';
import { ReportData } from '@/types/problemReporting';

interface LocationSectionProps {
  reportData: ReportData;
  onInputChange: (field: keyof ReportData, value: string) => void;
  onGetCurrentLocation: () => void;
}

const LocationSection = ({ reportData, onInputChange, onGetCurrentLocation }: LocationSectionProps) => {
  const [isLocating, setIsLocating] = useState(false);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Auto-capture GPS on component mount
  useEffect(() => {
    if (!reportData.coordinates) {
      handleGetLocation();
    }
  }, []);

  const handleGetLocation = async () => {
    setIsLocating(true);
    setLocationStatus('loading');
    setErrorMessage('');
    
    if (!navigator.geolocation) {
      setIsLocating(false);
      setLocationStatus('error');
      setErrorMessage('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        onInputChange('coordinates', coordinates);
        
        // Reverse geocoding to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          if (data.display_name) {
            setLocationAddress(data.display_name);
            // Auto-fill location
            const shortAddress = [
              data.address?.road,
              data.address?.suburb || data.address?.neighbourhood,
              data.address?.city || data.address?.town || data.address?.county
            ].filter(Boolean).join(', ');
            onInputChange('location', shortAddress || data.display_name.split(',').slice(0, 3).join(','));
          }
          setLocationStatus('success');
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          setLocationStatus('success'); // Still success as we have coordinates
        }
        
        setIsLocating(false);
      },
      (error) => {
        console.error('GPS Error:', error.message || 'Location access denied or unavailable');
        setIsLocating(false);
        setLocationStatus('error');
        setErrorMessage(
          error.code === 1 
            ? 'Location access denied. Please enable location permissions.' 
            : 'Unable to get your location. Please try again.'
        );
        onGetCurrentLocation();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const getMapUrl = () => {
    if (!reportData.coordinates) return null;
    const [lat, lng] = reportData.coordinates.split(',').map(s => s.trim());
    return `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lng) - 0.005}%2C${parseFloat(lat) - 0.005}%2C${parseFloat(lng) + 0.005}%2C${parseFloat(lat) + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;
  };

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
        {locationStatus === 'loading' && (
          <>
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <span className="text-sm text-blue-600">Detecting your location automatically...</span>
          </>
        )}
        {locationStatus === 'success' && (
          <>
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm text-green-600">Location captured successfully</span>
          </>
        )}
        {locationStatus === 'error' && (
          <>
            <MapPin className="h-5 w-5 text-red-600" />
            <span className="text-sm text-red-600">{errorMessage}</span>
            <button 
              onClick={handleGetLocation}
              className="ml-auto text-sm text-blue-600 underline"
            >
              Try again
            </button>
          </>
        )}
        {locationStatus === 'idle' && (
          <>
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Location will be captured automatically</span>
          </>
        )}
      </div>

      {/* Auto-detected location display (read-only) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Detected Location
        </label>
        <div className="p-3 bg-muted rounded-lg border">
          {reportData.location ? (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <span className="text-sm">{reportData.location}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {isLocating ? 'Detecting location...' : 'Location not yet detected'}
            </span>
          )}
        </div>
      </div>
      
      {/* GPS Coordinates (read-only) */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">GPS Coordinates</label>
        <div className="p-3 bg-muted rounded-lg border">
          {reportData.coordinates ? (
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-blue-600" />
              <code className="text-sm font-mono">{reportData.coordinates}</code>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {isLocating ? 'Capturing GPS...' : 'GPS coordinates not available'}
            </span>
          )}
        </div>
      </div>

      {/* Map View */}
      {reportData.coordinates && (
        <div className="space-y-2">
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
