import React from 'react';
import { Map } from 'lucide-react';
import { ReportData } from '@/types/problemReporting';
import CascadingLocationSelector from '@/components/location/CascadingLocationSelector';

interface LocationSectionProps {
  reportData: ReportData;
  onInputChange: (field: keyof ReportData, value: string) => void;
  onGetCurrentLocation: () => void;
  onLocationDataChange?: (data: { county: string; constituency: string; ward: string; gpsVerified: boolean; coordinates?: string }) => void;
}

const LocationSection = ({ reportData, onInputChange, onGetCurrentLocation, onLocationDataChange }: LocationSectionProps) => {

  const handleLocationChange = (data: { county: string; constituency: string; ward: string; gpsVerified: boolean; coordinates?: string }) => {
    // Update structured fields via callback
    if (onLocationDataChange) {
      onLocationDataChange(data);
    }

    // Derive the display location string from structured data
    const locationParts = [data.ward, data.constituency, data.county].filter(Boolean);
    const locationString = locationParts.length > 0 ? locationParts.join(', ') : '';
    onInputChange('location', locationString);

    // Update coordinates if provided by GPS
    if (data.coordinates) {
      onInputChange('coordinates', data.coordinates);
    }
  };

  const getMapUrl = () => {
    if (!reportData.coordinates) return null;
    const [lat, lng] = reportData.coordinates.split(',').map(s => s.trim());
    return `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lng) - 0.005}%2C${parseFloat(lat) - 0.005}%2C${parseFloat(lng) + 0.005}%2C${parseFloat(lat) + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;
  };

  return (
    <div className="space-y-4">
      <CascadingLocationSelector
        value={{
          county: reportData.county || '',
          constituency: reportData.constituency || '',
          ward: reportData.ward || '',
          gpsVerified: reportData.gpsVerified || false,
          coordinates: reportData.coordinates || undefined,
        }}
        onChange={handleLocationChange}
        enableGpsVerification={true}
        required={true}
        label="Problem Location"
      />

      {/* GPS Coordinates (read-only) */}
      {reportData.coordinates && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg border">
            <Map className="h-4 w-4 text-blue-600" />
            <code className="text-sm font-mono">{reportData.coordinates}</code>
          </div>

          {/* Map View */}
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
