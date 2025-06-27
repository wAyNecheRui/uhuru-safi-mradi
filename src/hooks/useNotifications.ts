
import { useState, useEffect } from 'react';
import { Notification, NotificationPreferences } from '@/types/onboarding';

export const useNotifications = (userId: string) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    sms: true,
    inApp: true,
    push: false
  });
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load notifications from localStorage
    const savedNotifications = localStorage.getItem(`notifications_${userId}`);
    const savedPreferences = localStorage.getItem(`notification_preferences_${userId}`);
    
    if (savedNotifications) {
      const parsedNotifications = JSON.parse(savedNotifications);
      setNotifications(parsedNotifications);
      setUnreadCount(parsedNotifications.filter((n: Notification) => !n.isRead).length);
    }
    
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, [userId]);

  const addNotification = (notification: Omit<Notification, 'id' | 'userId' | 'isRead' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      userId,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    const updatedNotifications = [newNotification, ...notifications];
    setNotifications(updatedNotifications);
    setUnreadCount(prev => prev + 1);
    
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updatedNotifications));
  };

  const markAsRead = (notificationId: string) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId ? { ...notification, isRead: true } : notification
    );
    
    setNotifications(updatedNotifications);
    setUnreadCount(updatedNotifications.filter(n => !n.isRead).length);
    
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updatedNotifications));
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      isRead: true
    }));
    
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updatedNotifications));
  };

  const updatePreferences = (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem(`notification_preferences_${userId}`, JSON.stringify(newPreferences));
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem(`notifications_${userId}`);
  };

  return {
    notifications,
    preferences,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    clearNotifications
  };
};
