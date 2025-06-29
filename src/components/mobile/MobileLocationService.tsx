
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

interface MobileLocationServiceProps {
  onLocationUpdate: (location: LocationData) => void;
  autoRequest?: boolean;
}

export const MobileLocationService = ({ 
  onLocationUpdate, 
  autoRequest = false 
}: MobileLocationServiceProps) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };

        // Try to get address from coordinates
        try {
          const response = await fetch(
            `https://api.openstreetmap.org/reverse?format=json&lat=${locationData.latitude}&lon=${locationData.longitude}`
          );
          const data = await response.json();
          locationData.address = data.display_name;
        } catch (err) {
          console.log('Address lookup failed:', err);
        }

        setLocation(locationData);
        onLocationUpdate(locationData);
        setLoading(false);
        
        toast({
          title: "Location Updated",
          description: "Your current location has been captured."
        });
      },
      (error) => {
        setLoading(false);
        let errorMessage = 'Unknown location error';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        setError(errorMessage);
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive"
        });
      },
      options
    );
  };

  useEffect(() => {
    if (autoRequest) {
      requestLocation();
    }
  }, [autoRequest]);

  const formatAccuracy = (accuracy: number) => {
    if (accuracy < 10) return 'Very High';
    if (accuracy < 50) return 'High';
    if (accuracy < 100) return 'Medium';
    return 'Low';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center">
            <MapPin className="h-4 w-4 mr-2" />
            Current Location
          </h3>
          <Button
            onClick={requestLocation}
            disabled={loading}
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
            {loading ? 'Getting Location...' : 'Get Location'}
          </Button>
        </div>

        {error && (
          <div className="flex items-center p-3 bg-red-50 rounded-lg mb-4">
            <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {location && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Latitude:</span>
                <p className="font-mono">{location.latitude.toFixed(6)}</p>
              </div>
              <div>
                <span className="text-gray-600">Longitude:</span>
                <p className="font-mono">{location.longitude.toFixed(6)}</p>
              </div>
            </div>
            
            <div className="text-sm">
              <span className="text-gray-600">Accuracy:</span>
              <span className="ml-2 font-medium">
                {formatAccuracy(location.accuracy)} (~{Math.round(location.accuracy)}m)
              </span>
            </div>

            {location.address && (
              <div className="text-sm">
                <span className="text-gray-600">Address:</span>
                <p className="mt-1 text-gray-900">{location.address}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const useLocationService = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = (): Promise<LocationData> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setLocation(locationData);
          resolve(locationData);
        },
        (error) => {
          setError(error.message);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  return {
    location,
    error,
    getCurrentLocation
  };
};
