import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCrossPlatform } from '@/hooks/useCrossPlatform';
import { 
  Smartphone, 
  Monitor, 
  Download, 
  CheckCircle, 
  Wifi, 
  WifiOff,
  Camera,
  MapPin,
  Bell,
  Apple,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const CrossPlatformInstall = () => {
  const { 
    platform, 
    isNative, 
    isPWA, 
    isOnline, 
    canInstall, 
    isStandalone,
    supportsNotifications,
    supportsCamera,
    supportsGeolocation,
    installPWA 
  } = useCrossPlatform();
  const { toast } = useToast();

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      toast({
        title: "App Installed!",
        description: "Uhuru Safi Mradi has been added to your home screen.",
      });
    } else {
      toast({
        title: "Installation Cancelled",
        description: "You can install the app later from the browser menu.",
        variant: "destructive",
      });
    }
  };

  const getPlatformIcon = () => {
    if (isNative) {
      return platform === 'ios' ? <Apple className="h-6 w-6" /> : <Smartphone className="h-6 w-6" />;
    }
    if (isPWA || isStandalone) {
      return <Smartphone className="h-6 w-6 text-emerald-600" />;
    }
    return <Monitor className="h-6 w-6 text-blue-600" />;
  };

  const getPlatformLabel = () => {
    if (isNative) {
      return platform === 'ios' ? 'iOS Native App' : 'Android Native App';
    }
    if (isPWA || isStandalone) {
      return 'Installed Web App (PWA)';
    }
    return 'Web Browser';
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getPlatformIcon()}
          <span>Platform & Installation</span>
        </CardTitle>
        <CardDescription>
          {isNative 
            ? "You're using the native mobile app with full device access."
            : isPWA 
              ? "App is installed on your device."
              : "Install this app for the best experience."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform Status */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={isNative ? "default" : isPWA ? "default" : "secondary"}>
            {getPlatformLabel()}
          </Badge>
          
          <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1">
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Feature Support */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="flex items-center gap-1">
            <Camera className={`h-4 w-4 ${supportsCamera ? 'text-emerald-600' : 'text-gray-400'}`} />
            <span className={supportsCamera ? '' : 'text-muted-foreground'}>Camera</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className={`h-4 w-4 ${supportsGeolocation ? 'text-emerald-600' : 'text-gray-400'}`} />
            <span className={supportsGeolocation ? '' : 'text-muted-foreground'}>Location</span>
          </div>
          <div className="flex items-center gap-1">
            <Bell className={`h-4 w-4 ${supportsNotifications ? 'text-emerald-600' : 'text-gray-400'}`} />
            <span className={supportsNotifications ? '' : 'text-muted-foreground'}>Alerts</span>
          </div>
        </div>

        {/* Install Button */}
        {canInstall && !isNative && !isPWA && (
          <div className="pt-2 border-t">
            <Button onClick={handleInstall} className="w-full gap-2">
              <Download className="h-4 w-4" />
              Install App
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Install for faster access, offline support, and push notifications
            </p>
          </div>
        )}

        {(isPWA || isNative) && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 pt-2 border-t">
            <CheckCircle className="h-4 w-4" />
            <span>App is installed with full features enabled</span>
          </div>
        )}

        {!canInstall && !isPWA && !isNative && (
          <div className="text-sm text-muted-foreground pt-2 border-t">
            <p className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              To install: Use browser menu → "Add to Home Screen"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
