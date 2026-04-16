import React from 'react';
import { Map, MapPin } from 'lucide-react';
import { ReportData } from '@/types/problemReporting';
import CascadingLocationSelector from '../location/CascadingLocationSelector';

interface LocationSectionProps {
  reportData: ReportData;
  onInputChange: (field: keyof ReportData, value: string) => void;
  onLocationDataChange?: (data: { county: string; constituency: string; ward: string; gpsVerified: boolean; coordinates?: string }) => void;
}

const LocationSection = ({ reportData, onInputChange, onLocationDataChange }: LocationSectionProps) => {

  const handleSelectorChange = (data: { county: string; constituency: string; ward: string; gpsVerified: boolean; coordinates?: string }) => {
    // Update the main report data string for legacy compatibility
    const locationString = [data.ward, data.constituency, data.county ? `${data.county} County` : ''].filter(Boolean).join(', ');
    onInputChange('location', locationString);

    if (data.coordinates) {
      onInputChange('coordinates', data.coordinates);
    }

    // Call the structured data change handler
    if (onLocationDataChange) {
      onLocationDataChange(data);
    }
  };

  const getMapUrl = () => {
    if (!reportData.coordinates) return null;
    const coordsStr = reportData.coordinates;
    const parts = coordsStr.split(',').map(s => s.trim());
    if (parts.length !== 2) return null;

    const [lat, lng] = parts;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lng) - 0.005}%2C${parseFloat(lat) - 0.005}%2C${parseFloat(lng) + 0.005}%2C${parseFloat(lat) + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`;
  };

  return (
    <div className="space-y-4">
      <CascadingLocationSelector
        label="Problem Location"
        required
        value={{
          county: reportData.county || '',
          constituency: reportData.constituency || '',
          ward: reportData.ward || '',
          gpsVerified: reportData.gpsVerified || false,
          coordinates: reportData.coordinates
        }}
        onChange={handleSelectorChange}
        enableGpsVerification={true}
        compact={true}
      />


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
