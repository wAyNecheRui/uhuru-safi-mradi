
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Map } from 'lucide-react';
import { ReportData } from '@/types/problemReporting';

interface LocationSectionProps {
  reportData: ReportData;
  onInputChange: (field: keyof ReportData, value: string) => void;
  onGetCurrentLocation: () => void;
}

const LocationSection = ({ reportData, onInputChange, onGetCurrentLocation }: LocationSectionProps) => {
  const [isLocating, setIsLocating] = useState(false);
  const [locationAddress, setLocationAddress] = useState<string>('');

  const handleGetLocation = async () => {
    setIsLocating(true);
    
    if (!navigator.geolocation) {
      setIsLocating(false);
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
            // Auto-fill location if empty
            if (!reportData.location) {
              const shortAddress = [
                data.address?.road,
                data.address?.suburb || data.address?.neighbourhood,
                data.address?.city || data.address?.town || data.address?.county
              ].filter(Boolean).join(', ');
              onInputChange('location', shortAddress || data.display_name.split(',').slice(0, 3).join(','));
            }
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
        }
        
        setIsLocating(false);
      },
      (error) => {
        console.error('GPS Error:', error.message || 'Location access denied or unavailable');
        setIsLocating(false);
        // Call the parent's location handler as fallback
        onGetCurrentLocation();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  // Remove auto-capture - let user manually trigger GPS to avoid permission issues

  const getMapUrl = () => {
    if (!reportData.coordinates) return null;
    const [lat, lng] = reportData.coordinates.split(',').map(s => s.trim());
    return `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lng) - 0.005}%2C${parseFloat(lat) - 0.005}%2C${parseFloat(lng) + 0.005}%2C${parseFloat(lat) + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
        <Input
          placeholder="e.g., Mombasa Road, Industrial Area, Nairobi"
          value={reportData.location}
          onChange={(e) => onInputChange('location', e.target.value)}
        />
        {locationAddress && (
          <p className="text-xs text-muted-foreground mt-1">
            Detected: {locationAddress}
          </p>
        )}
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">GPS Coordinates</label>
        <div className="flex space-x-2">
          <Input
            placeholder={isLocating ? "Capturing location..." : "GPS coordinates"}
            value={reportData.coordinates}
            onChange={(e) => onInputChange('coordinates', e.target.value)}
            readOnly
          />
          <Button 
            onClick={handleGetLocation} 
            variant="outline" 
            size="sm"
            disabled={isLocating}
          >
            {isLocating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Map View */}
      {reportData.coordinates && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Map className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">Location captured successfully</span>
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
            📍 {reportData.coordinates}
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationSection;
