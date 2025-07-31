import { useState, useEffect } from 'react';
import { notificationService, type Notification } from '../utils/notificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshNotifications = () => {
    setNotifications(notificationService.getAll());
    setUnreadCount(notificationService.getUnreadCount());
  };

  useEffect(() => {
    // Initial load
    refreshNotifications();

    // Subscribe to changes
    const unsubscribe = notificationService.subscribe(refreshNotifications);

    return unsubscribe;
  }, []);

  const markAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const removeNotification = (id: string) => {
    notificationService.removeNotification(id);
  };

  const clearAll = () => {
    notificationService.clearAll();
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    refresh: refreshNotifications
  };
};