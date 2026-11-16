import { createContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchNotifications, markAllAsRead, markAsRead } from '../services/notificationService';
import { listenForNotifications } from '../services/socketService';

export const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return undefined;
    }

    let active = true;
    const loadNotifications = async () => {
      try {
        setLoading(true);
        const data = await fetchNotifications();
        if (!active) return;
        setNotifications(data);
        setError(null);
      } catch (err) {
        if (active) setError(err.message || 'Failed to load notifications');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadNotifications();
    const socket = listenForNotifications((notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    return () => {
      active = false;
      socket.off('notification');
    };
  }, [currentUser]);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications((current) => current.map((notification) => (
        notification.id === notificationId ? { ...notification, read: true } : notification
      )));
    } catch (err) {
      setError(err.message || 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    } catch (err) {
      setError(err.message || 'Failed to mark all notifications as read');
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
  };

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};
