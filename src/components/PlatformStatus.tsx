
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNativeFeatures } from '@/hooks/useNativeFeatures';
import { Smartphone, Globe, Wifi, WifiOff, Bell, BellOff } from 'lucide-react';

export const PlatformStatus = () => {
  const { isNative, isOnline, notificationPermission } = useNativeFeatures();

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            {isNative ? (
              <Smartphone className="h-5 w-5 text-green-600" />
            ) : (
              <Globe className="h-5 w-5 text-blue-600" />
            )}
            <span>Platform Status</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Badge variant={isNative ? "default" : "secondary"}>
              {isNative ? "Native App" : "Web App"}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? "Online" : "Offline"}
            </Badge>
          </div>
          
          <div className="flex items-center space-x-2">
            {notificationPermission ? (
              <Bell className="h-4 w-4 text-green-600" />
            ) : (
              <BellOff className="h-4 w-4 text-gray-400" />
            )}
            <Badge variant={notificationPermission ? "default" : "secondary"}>
              {notificationPermission ? "Notifications On" : "Notifications Off"}
            </Badge>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>Cross-Platform Features:</strong> 
            {isNative ? " Native camera, GPS, offline storage, push notifications" : " Web camera, geolocation, local storage"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
