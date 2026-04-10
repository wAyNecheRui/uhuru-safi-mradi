import React, { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { getCountyNames, getConstituencies, getWards, getCountyByCoordinates } from '@/constants/kenyaAdminData';

interface LocationData {
  county: string;
  constituency: string;
  ward: string;
  gpsVerified: boolean;
  coordinates?: string;
}

interface CascadingLocationSelectorProps {
  value: LocationData;
  onChange: (data: LocationData) => void;
  enableGpsVerification?: boolean;
  required?: boolean;
  label?: string;
  compact?: boolean;
}

const CascadingLocationSelector: React.FC<CascadingLocationSelectorProps> = ({
  value,
  onChange,
  enableGpsVerification = true,
  required = false,
  label = 'Location',
  compact = false,
}) => {
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'verified' | 'mismatch' | 'error'>('idle');
  const [detectedCounty, setDetectedCounty] = useState<string>('');

  const counties = useMemo(() => getCountyNames(), []);
  const constituencies = useMemo(() => value.county ? getConstituencies(value.county) : [], [value.county]);
  const wards = useMemo(() => value.county && value.constituency ? getWards(value.county, value.constituency) : [], [value.county, value.constituency]);

  const handleCountyChange = (county: string) => {
    onChange({ ...value, county, constituency: '', ward: '', gpsVerified: false });
  };

  const handleConstituencyChange = (constituency: string) => {
    onChange({ ...value, constituency, ward: '', gpsVerified: false });
  };

  const handleWardChange = (ward: string) => {
    onChange({ ...value, ward });
  };

  const verifyWithGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }
    setGpsStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const detected = getCountyByCoordinates(latitude, longitude);
        const coords = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        if (detected) {
          setDetectedCounty(detected.name);
          if (value.county && detected.name.toLowerCase() === value.county.toLowerCase()) {
            setGpsStatus('verified');
            onChange({ ...value, gpsVerified: true, coordinates: coords });
          } else if (!value.county) {
            // Auto-fill county from GPS
            onChange({ ...value, county: detected.name, gpsVerified: true, coordinates: coords, constituency: '', ward: '' });
            setGpsStatus('verified');
          } else {
            setGpsStatus('mismatch');
            onChange({ ...value, coordinates: coords });
          }
        } else {
          setGpsStatus('error');
        }
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  useEffect(() => {
    if (enableGpsVerification && !value.county) {
      verifyWithGps();
    }
  }, []);

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-sm font-semibold text-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </label>
      )}

      {/* GPS Status */}
      {enableGpsVerification && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/50">
          {gpsStatus === 'loading' && (
            <>
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Detecting location via GPS...</span>
            </>
          )}
          {gpsStatus === 'verified' && (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-700 dark:text-green-400">GPS verified — {detectedCounty} County</span>
              <Badge variant="outline" className="ml-auto text-[10px] border-green-300 text-green-700 dark:text-green-400">Verified</Badge>
            </>
          )}
          {gpsStatus === 'mismatch' && (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-amber-700 dark:text-amber-400">GPS detects {detectedCounty}, but you selected {value.county}</span>
            </>
          )}
          {gpsStatus === 'error' && (
            <>
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">GPS unavailable — select manually</span>
              <button onClick={verifyWithGps} className="ml-auto text-xs text-primary underline">Retry</button>
            </>
          )}
          {gpsStatus === 'idle' && (
            <>
              <Navigation className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Select location or</span>
              <button onClick={verifyWithGps} className="text-xs text-primary font-medium underline">detect via GPS</button>
            </>
          )}
        </div>
      )}

      {/* Cascading Selects */}
      <div className={compact ? 'grid grid-cols-1 sm:grid-cols-3 gap-2' : 'space-y-3'}>
        <div>
          {!compact && <label className="block text-xs font-medium text-muted-foreground mb-1">County</label>}
          <Select value={value.county} onValueChange={handleCountyChange}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select County" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {counties.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          {!compact && <label className="block text-xs font-medium text-muted-foreground mb-1">Constituency</label>}
          <Select value={value.constituency} onValueChange={handleConstituencyChange} disabled={!value.county}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={value.county ? 'Select Constituency' : 'Select county first'} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {constituencies.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          {!compact && <label className="block text-xs font-medium text-muted-foreground mb-1">Ward</label>}
          <Select value={value.ward} onValueChange={handleWardChange} disabled={!value.constituency}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={value.constituency ? 'Select Ward' : 'Select constituency first'} />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {wards.map(w => (
                <SelectItem key={w} value={w}>{w}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Coordinates display */}
      {value.coordinates && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <code className="font-mono">{value.coordinates}</code>
        </div>
      )}
    </div>
  );
};

export default CascadingLocationSelector;
