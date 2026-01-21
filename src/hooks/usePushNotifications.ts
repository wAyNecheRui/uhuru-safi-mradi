// Hook for managing push notifications across platforms
import { useState, useEffect, useCallback } from 'react';
import { PushNotificationService, PushNotificationPayload } from '@/services/PushNotificationService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UsePushNotificationsResult {
  isSupported: boolean;
  isEnabled: boolean;
  permissionStatus: NotificationPermission;
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  showNotification: (payload: PushNotificationPayload) => Promise<void>;
}

export const usePushNotifications = (): UsePushNotificationsResult => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize on mount
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const supported = PushNotificationService.isSupported();
        setIsSupported(supported);

        if (supported) {
          const status = PushNotificationService.getPermissionStatus();
          setPermissionStatus(status);
          setIsEnabled(status === 'granted');

          // Auto-initialize if authenticated and permission granted
          if (isAuthenticated && status === 'granted') {
            await PushNotificationService.initialize();
          }
        }
      } catch (error) {
        console.error('[usePushNotifications] Init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [isAuthenticated]);

  // Listen for push notifications in foreground
  useEffect(() => {
    const handlePushNotification = (event: CustomEvent) => {
      const notification = event.detail;
      toast({
        title: notification.title || 'New Notification',
        description: notification.body || notification.message,
      });
    };

    window.addEventListener('push-notification', handlePushNotification as EventListener);
    return () => {
      window.removeEventListener('push-notification', handlePushNotification as EventListener);
    };
  }, [toast]);

  // Request permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const permission = await PushNotificationService.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        setIsEnabled(true);
        await PushNotificationService.initialize();
        toast({
          title: 'Notifications Enabled',
          description: 'You will now receive push notifications',
        });
        return true;
      } else if (permission === 'denied') {
        toast({
          title: 'Notifications Blocked',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
      }
      return false;
    } catch (error) {
      console.error('[usePushNotifications] Permission error:', error);
      toast({
        title: 'Error',
        description: 'Failed to enable notifications',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Subscribe to push
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || permissionStatus !== 'granted') {
      const granted = await requestPermission();
      if (!granted) return false;
    }

    try {
      setIsLoading(true);
      const subscription = await PushNotificationService.subscribe();
      if (subscription) {
        setIsEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[usePushNotifications] Subscribe error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permissionStatus, requestPermission]);

  // Unsubscribe
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      const success = await PushNotificationService.unsubscribe();
      if (success) {
        setIsEnabled(false);
        toast({
          title: 'Notifications Disabled',
          description: 'You will no longer receive push notifications',
        });
      }
      return success;
    } catch (error) {
      console.error('[usePushNotifications] Unsubscribe error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Show local notification
  const showNotification = useCallback(async (payload: PushNotificationPayload): Promise<void> => {
    if (!isEnabled) {
      console.warn('[usePushNotifications] Notifications not enabled');
      return;
    }
    await PushNotificationService.showLocalNotification(payload);
  }, [isEnabled]);

  return {
    isSupported,
    isEnabled,
    permissionStatus,
    isLoading,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
  };
};
