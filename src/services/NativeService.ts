
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation, Position } from '@capacitor/geolocation';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Network } from '@capacitor/network';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export class NativeService {
  // Check if running on native platform
  static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  // Camera functionality
  static async takePhoto(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      return image.base64String || null;
    } catch (error) {
      console.error('Camera error:', error);
      return null;
    }
  }

  static async selectPhoto(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });
      return image.base64String || null;
    } catch (error) {
      console.error('Photo selection error:', error);
      return null;
    }
  }

  // Geolocation functionality
  static async getCurrentPosition(): Promise<Position | null> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      return position;
    } catch (error) {
      console.error('Geolocation error:', error);
      return null;
    }
  }

  // File system operations
  static async saveFile(data: string, fileName: string): Promise<boolean> {
    try {
      await Filesystem.writeFile({
        path: fileName,
        data: data,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      return true;
    } catch (error) {
      console.error('File save error:', error);
      return false;
    }
  }

  static async readFile(fileName: string): Promise<string | null> {
    try {
      const result = await Filesystem.readFile({
        path: fileName,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      return result.data as string;
    } catch (error) {
      console.error('File read error:', error);
      return null;
    }
  }

  // Network status
  static async getNetworkStatus(): Promise<boolean> {
    try {
      const status = await Network.getStatus();
      return status.connected;
    } catch (error) {
      console.error('Network status error:', error);
      return false;
    }
  }

  // Preferences (local storage)
  static async setPreference(key: string, value: string): Promise<void> {
    try {
      await Preferences.set({ key, value });
    } catch (error) {
      console.error('Preference set error:', error);
    }
  }

  static async getPreference(key: string): Promise<string | null> {
    try {
      const result = await Preferences.get({ key });
      return result.value;
    } catch (error) {
      console.error('Preference get error:', error);
      return null;
    }
  }

  // Push notifications
  static async requestNotificationPermissions(): Promise<boolean> {
    try {
      const result = await PushNotifications.requestPermissions();
      return result.receive === 'granted';
    } catch (error) {
      console.error('Notification permission error:', error);
      return false;
    }
  }

  static async registerForNotifications(): Promise<void> {
    try {
      await PushNotifications.register();
    } catch (error) {
      console.error('Notification registration error:', error);
    }
  }
}
