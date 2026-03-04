// Push Notification Service for Web and Native platforms
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
}

class PushNotificationServiceClass {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isInitialized = false;
  private permissionStatus: NotificationPermission = 'default';

  // Check if push notifications are supported
  isSupported(): boolean {
    if (Capacitor.isNativePlatform()) {
      return true;
    }
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    if (Capacitor.isNativePlatform()) {
      return this.permissionStatus;
    }
    return Notification.permission;
  }

  // Initialize the push notification service
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      if (Capacitor.isNativePlatform()) {
        return await this.initializeNative();
      } else {
        return await this.initializeWeb();
      }
    } catch (error) {
      console.error('[PushService] Initialization failed:', error);
      return false;
    }
  }

  // Initialize for native platforms (iOS/Android)
  private async initializeNative(): Promise<boolean> {
    try {
      // Request permission
      const permResult = await PushNotifications.requestPermissions();
      this.permissionStatus = permResult.receive === 'granted' ? 'granted' : 'denied';

      if (permResult.receive !== 'granted') {
        console.log('[PushService] Native notification permission denied');
        return false;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Set up listeners
      PushNotifications.addListener('registration', (token) => {
        console.log('[PushService] Native registration token:', token.value);
        this.saveDeviceToken(token.value, 'native');
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('[PushService] Native registration error:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[PushService] Native push received:', notification);
        // Handle foreground notification
        this.handleForegroundNotification(notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('[PushService] Native action performed:', action);
        this.handleNotificationAction(action.notification.data);
      });

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('[PushService] Native initialization error:', error);
      return false;
    }
  }

  // Initialize for web platform
  private async initializeWeb(): Promise<boolean> {
    try {
      // Check for service worker support
      if (!('serviceWorker' in navigator)) {
        console.warn('[PushService] Service workers not supported');
        return false;
      }

      // Register push service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw-push.js', {
        scope: '/'
      });

      console.log('[PushService] Service worker registered:', this.swRegistration);

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('[PushService] Web initialization error:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (Capacitor.isNativePlatform()) {
      const result = await PushNotifications.requestPermissions();
      this.permissionStatus = result.receive === 'granted' ? 'granted' : 'denied';
      return this.permissionStatus;
    }

    if (!('Notification' in window)) {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  // Subscribe to push notifications (web only)
  async subscribe(): Promise<PushSubscription | null> {
    if (Capacitor.isNativePlatform()) {
      // Native uses token-based registration, not web push
      return null;
    }

    if (!this.swRegistration) {
      await this.initialize();
    }

    if (!this.swRegistration) {
      console.error('[PushService] No service worker registration');
      return null;
    }

    try {
      // Check if already subscribed
      let subscription = await (this.swRegistration as any).pushManager?.getSubscription();

      if (!subscription) {
        // Subscribe with VAPID key (you would need to generate this)
        // For now, we'll use a demo subscription
        console.log('[PushService] Creating new subscription...');
        
        // In production, you'd use a real VAPID public key
        // subscription = await this.swRegistration.pushManager.subscribe({
        //   userVisibleOnly: true,
        //   applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        // });
      }

      if (subscription) {
        const subData = subscription.toJSON();
        const pushSub: PushSubscription = {
          endpoint: subData.endpoint || '',
          keys: {
            p256dh: subData.keys?.p256dh || '',
            auth: subData.keys?.auth || ''
          }
        };

        // Save subscription to database
        await this.saveWebPushSubscription(pushSub);
        return pushSub;
      }

      return null;
    } catch (error) {
      console.error('[PushService] Subscription error:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        await PushNotifications.removeAllListeners();
        return true;
      } catch {
        return false;
      }
    }

    if (!this.swRegistration) return false;

    try {
      const subscription = await (this.swRegistration as any).pushManager?.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        // Remove from database
        await this.removeWebPushSubscription(subscription.endpoint);
      }
      return true;
    } catch (error) {
      console.error('[PushService] Unsubscribe error:', error);
      return false;
    }
  }

  // Show a local notification (for when app is in foreground)
  async showLocalNotification(payload: PushNotificationPayload): Promise<void> {
    if (Notification.permission !== 'granted') {
      console.warn('[PushService] Notification permission not granted');
      return;
    }

    if (this.swRegistration) {
      await this.swRegistration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/icon-72x72.png',
        tag: payload.tag,
        data: payload.data,
        requireInteraction: payload.priority === 'high'
      });
    } else if ('Notification' in window) {
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        tag: payload.tag
      });
    }
  }

  // Handle foreground notification on native
  private handleForegroundNotification(notification: any): void {
    // Dispatch custom event for in-app handling
    window.dispatchEvent(new CustomEvent('push-notification', {
      detail: notification
    }));
  }

  // Handle notification action/click
  private handleNotificationAction(data: any): void {
    if (data?.action_url) {
      window.location.href = data.action_url;
    }
  }

  // Save device token to database (for native push)
  private async saveDeviceToken(token: string, platform: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Store in user preferences or dedicated table
      console.log('[PushService] Saving device token for user:', user.id, 'Platform:', platform);
      // In production, you'd save this to a push_subscriptions table
    } catch (error) {
      console.error('[PushService] Error saving device token:', error);
    }
  }

  // Save web push subscription
  private async saveWebPushSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('[PushService] Saving web push subscription for user:', user.id);
      // In production, save to push_subscriptions table
    } catch (error) {
      console.error('[PushService] Error saving web subscription:', error);
    }
  }

  // Remove web push subscription
  private async removeWebPushSubscription(endpoint: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('[PushService] Removing web push subscription:', endpoint);
      // In production, remove from push_subscriptions table
    } catch (error) {
      console.error('[PushService] Error removing subscription:', error);
    }
  }
}

export const PushNotificationService = new PushNotificationServiceClass();
