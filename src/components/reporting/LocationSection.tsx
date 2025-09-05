
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { ReportData } from '@/types/problemReporting';

interface LocationSectionProps {
  reportData: ReportData;
  onInputChange: (field: keyof ReportData, value: string) => void;
  onGetCurrentLocation: () => void;
}

const LocationSection = ({ reportData, onInputChange, onGetCurrentLocation }: LocationSectionProps) => {
  React.useEffect(() => {
    // Auto-capture GPS coordinates when component mounts
    onGetCurrentLocation();
  }, [onGetCurrentLocation]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
        <Input
          placeholder="e.g., Mombasa Road, Industrial Area, Nairobi"
          value={reportData.location}
          onChange={(e) => onInputChange('location', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">GPS Coordinates</label>
        <div className="flex space-x-2">
          <Input
            placeholder="Auto-capturing location..."
            value={reportData.coordinates}
            onChange={(e) => onInputChange('coordinates', e.target.value)}
            readOnly
          />
          <Button onClick={onGetCurrentLocation} variant="outline" size="sm">
            <MapPin className="h-4 w-4" />
          </Button>
        </div>
        {reportData.coordinates && (
          <p className="text-xs text-green-600 mt-1">
            ✓ GPS location captured successfully
          </p>
        )}
      </div>
    </div>
  );
};

export default LocationSection;
