
import { useState, useEffect } from 'react';
import { NativeService } from '@/services/NativeService';
import { Position } from '@capacitor/geolocation';

export const useNativeFeatures = () => {
  const [isNative, setIsNative] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState<Position | null>(null);
  const [notificationPermission, setNotificationPermission] = useState(false);

  useEffect(() => {
    setIsNative(NativeService.isNative());
    
    // Check network status
    const checkNetworkStatus = async () => {
      const status = await NativeService.getNetworkStatus();
      setIsOnline(status);
    };

    checkNetworkStatus();
    
    // Request notification permissions if native
    if (NativeService.isNative()) {
      const requestPermissions = async () => {
        const granted = await NativeService.requestNotificationPermissions();
        setNotificationPermission(granted);
        
        if (granted) {
          await NativeService.registerForNotifications();
        }
      };
      
      requestPermissions();
    }
  }, []);

  const takePhoto = async (): Promise<string | null> => {
    return await NativeService.takePhoto();
  };

  const selectPhoto = async (): Promise<string | null> => {
    return await NativeService.selectPhoto();
  };

  const getCurrentLocation = async (): Promise<Position | null> => {
    const position = await NativeService.getCurrentPosition();
    setLocation(position);
    return position;
  };

  const saveOfflineData = async (key: string, data: any): Promise<void> => {
    const jsonData = JSON.stringify(data);
    if (isNative) {
      await NativeService.saveFile(jsonData, `${key}.json`);
    } else {
      localStorage.setItem(key, jsonData);
    }
  };

  const getOfflineData = async (key: string): Promise<any | null> => {
    try {
      let jsonData: string | null;
      
      if (isNative) {
        jsonData = await NativeService.readFile(`${key}.json`);
      } else {
        jsonData = localStorage.getItem(key);
      }
      
      return jsonData ? JSON.parse(jsonData) : null;
    } catch (error) {
      console.error('Error retrieving offline data:', error);
      return null;
    }
  };

  return {
    isNative,
    isOnline,
    location,
    notificationPermission,
    takePhoto,
    selectPhoto,
    getCurrentLocation,
    saveOfflineData,
    getOfflineData
  };
};
