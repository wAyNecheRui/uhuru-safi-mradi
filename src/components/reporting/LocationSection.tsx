import React, { useEffect } from 'react';
import { Map, MapPin } from 'lucide-react';
import { ReportData } from '@/types/problemReporting';
import { Button } from '@/components/ui/button';

interface LocationSectionProps {
  reportData: ReportData;
  onInputChange: (field: keyof ReportData, value: string) => void;
  onDetectLocation: () => void;
}

const LocationSection = ({ reportData, onDetectLocation }: LocationSectionProps) => {

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
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
          Problem Location <span className="text-destructive">*</span>
        </label>
      </div>

      <div className="p-4 bg-muted border rounded-lg space-y-4">
        {reportData.location ? (
          <div>
            <div className="flex items-center gap-2 mb-2 text-green-700 bg-green-50 p-2 rounded border border-green-200">
              <MapPin className="h-5 w-5" />
              <span className="font-medium">Detected Location:</span>
              <span className="ml-1">{reportData.location}</span>
            </div>

            {/* GPS Coordinates & Map */}
            {reportData.coordinates && (
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 p-3 bg-background rounded border">
                  <Map className="h-4 w-4 text-blue-600" />
                  <code className="text-sm font-mono">{reportData.coordinates}</code>
                </div>

                <div className="border rounded-lg overflow-hidden bg-background">
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
                <p className="text-xs text-muted-foreground text-center mt-2">
                  📍 Your report will be automatically tagged to this location
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="animate-pulse flex flex-col items-center">
              <MapPin className="h-10 w-10 text-muted-foreground mb-3 opacity-30" />
              <p className="text-muted-foreground mb-2">Identifying map location...</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full" />
                Waiting for GPS signal
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationSection;
