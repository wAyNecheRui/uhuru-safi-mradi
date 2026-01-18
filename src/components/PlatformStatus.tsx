import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCrossPlatform } from '@/hooks/useCrossPlatform';
import { 
  Smartphone, 
  Globe, 
  Wifi, 
  WifiOff, 
  Bell, 
  BellOff,
  Download,
  Camera,
  MapPin,
  CheckCircle,
  Monitor
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const PlatformStatus = () => {
  const { 
    platform,
    isNative, 
    isPWA,
    isOnline, 
    canInstall,
    supportsNotifications,
    supportsCamera,
    supportsGeolocation,
    notificationPermission,
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
    }
  };

  const getPlatformIcon = () => {
    if (isNative) return <Smartphone className="h-5 w-5 text-emerald-600" />;
    if (isPWA) return <Smartphone className="h-5 w-5 text-blue-600" />;
    return <Monitor className="h-5 w-5 text-gray-600" />;
  };

  const getPlatformLabel = () => {
    if (isNative) return platform === 'ios' ? 'iOS App' : 'Android App';
    if (isPWA) return 'Installed PWA';
    return 'Web Browser';
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            {getPlatformIcon()}
            <span>Platform Status</span>
          </div>
          <Badge variant={isNative ? "default" : isPWA ? "default" : "secondary"}>
            {getPlatformLabel()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-emerald-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-destructive" />
            )}
            <span className="text-sm">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          
          {/* Notification Status */}
          <div className="flex items-center gap-2">
            {notificationPermission ? (
              <Bell className="h-4 w-4 text-emerald-600" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">{notificationPermission ? 'Alerts On' : 'Alerts Off'}</span>
          </div>

          {/* Camera Support */}
          <div className="flex items-center gap-2">
            <Camera className={`h-4 w-4 ${supportsCamera ? 'text-emerald-600' : 'text-muted-foreground'}`} />
            <span className="text-sm">{supportsCamera ? 'Camera' : 'No Camera'}</span>
          </div>

          {/* Location Support */}
          <div className="flex items-center gap-2">
            <MapPin className={`h-4 w-4 ${supportsGeolocation ? 'text-emerald-600' : 'text-muted-foreground'}`} />
            <span className="text-sm">{supportsGeolocation ? 'GPS' : 'No GPS'}</span>
          </div>
        </div>
        
        {/* Install prompt for web users */}
        {canInstall && !isNative && !isPWA && (
          <div className="mt-4 pt-3 border-t">
            <Button onClick={handleInstall} size="sm" className="w-full gap-2">
              <Download className="h-4 w-4" />
              Install App for Better Experience
            </Button>
          </div>
        )}

        {(isPWA || isNative) && (
          <div className="mt-4 pt-3 border-t flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle className="h-4 w-4" />
            <span>Full cross-platform features enabled</span>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-3">
          {isNative 
            ? `Native ${platform} app with full device access`
            : isPWA 
              ? 'Installed web app with offline support'
              : 'Visit on mobile & install for push notifications and offline access'
          }
        </p>
      </CardContent>
    </Card>
  );
};
