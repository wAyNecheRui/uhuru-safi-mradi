// Hook for subscribing to and managing system alerts
import { useState, useEffect, useCallback } from 'react';
import { SystemAlertService, SystemAlert, AlertCategory, AlertSeverity } from '@/services/SystemAlertService';
import { useToast } from '@/hooks/use-toast';
import { usePushNotifications } from './usePushNotifications';

interface UseSystemAlertsResult {
  alerts: SystemAlert[];
  unreadCount: number;
  markAsRead: (alertId: string) => void;
  markAllAsRead: () => void;
  dismissAlert: (alertId: string) => void;
  clearAlerts: () => void;
  getAlertsByCategory: (category: AlertCategory) => SystemAlert[];
  getAlertsBySeverity: (severity: AlertSeverity) => SystemAlert[];
}

interface UseSystemAlertsOptions {
  showToasts?: boolean;
  sendPushNotifications?: boolean;
  categories?: AlertCategory[];
}

export const useSystemAlerts = (options: UseSystemAlertsOptions = {}): UseSystemAlertsResult => {
  const { showToasts = true, sendPushNotifications = true, categories } = options;
  const { toast } = useToast();
  const { showNotification, isEnabled: pushEnabled } = usePushNotifications();
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Subscribe to alerts
  useEffect(() => {
    // Load existing alerts
    setAlerts(SystemAlertService.getActiveAlerts());
    setUnreadCount(SystemAlertService.getUnreadCount());

    // Subscribe to new alerts
    const unsubscribe = SystemAlertService.subscribe((alert) => {
      // Check if dismissed
      if (alert.metadata?.dismissed) {
        setAlerts(SystemAlertService.getActiveAlerts());
        setUnreadCount(SystemAlertService.getUnreadCount());
        return;
      }

      // Filter by categories if specified
      if (categories && !categories.includes(alert.category)) {
        return;
      }

      // Update alerts list
      setAlerts(prev => {
        const exists = prev.find(a => a.id === alert.id);
        if (exists) {
          return prev.map(a => a.id === alert.id ? alert : a);
        }
        return [alert, ...prev];
      });
      setUnreadCount(SystemAlertService.getUnreadCount());

      // Show toast for new alerts
      if (showToasts) {
        const variant = alert.severity === 'error' || alert.severity === 'critical' 
          ? 'destructive' 
          : 'default';
        
        toast({
          title: alert.title,
          description: alert.message,
          variant,
        });
      }

      // Send push notification for high-priority alerts
      if (sendPushNotifications && pushEnabled && 
          (alert.severity === 'critical' || alert.severity === 'warning')) {
        showNotification({
          title: alert.title,
          body: alert.message,
          tag: alert.category,
          priority: alert.severity === 'critical' ? 'high' : 'normal',
          data: { 
            id: alert.id, 
            category: alert.category,
            action_url: alert.actionUrl 
          }
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [toast, showToasts, sendPushNotifications, pushEnabled, showNotification, categories]);

  const markAsRead = useCallback((alertId: string) => {
    SystemAlertService.markAsRead(alertId);
    setAlerts(SystemAlertService.getActiveAlerts());
    setUnreadCount(SystemAlertService.getUnreadCount());
  }, []);

  const markAllAsRead = useCallback(() => {
    SystemAlertService.markAllAsRead();
    setAlerts(SystemAlertService.getActiveAlerts());
    setUnreadCount(0);
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    SystemAlertService.dismissAlert(alertId);
    setAlerts(SystemAlertService.getActiveAlerts());
    setUnreadCount(SystemAlertService.getUnreadCount());
  }, []);

  const clearAlerts = useCallback(() => {
    SystemAlertService.clearAlerts();
    setAlerts(SystemAlertService.getActiveAlerts());
    setUnreadCount(SystemAlertService.getUnreadCount());
  }, []);

  const getAlertsByCategory = useCallback((category: AlertCategory) => {
    return SystemAlertService.getAlertsByCategory(category);
  }, []);

  const getAlertsBySeverity = useCallback((severity: AlertSeverity) => {
    return SystemAlertService.getAlertsBySeverity(severity);
  }, []);

  return {
    alerts,
    unreadCount,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    clearAlerts,
    getAlertsByCategory,
    getAlertsBySeverity,
  };
};
