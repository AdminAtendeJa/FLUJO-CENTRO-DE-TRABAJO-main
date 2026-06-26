import { useState, useEffect } from 'react';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initialize notifications
    useEffect(() => {
        // In a real app, this would come from an API or WebSocket connection
        // For now, we'll initialize with an empty array
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    const addNotification = (notification) => {
        const newNotification = {
            id: Date.now(),
            timestamp: new Date(),
            read: false,
            ...notification
        };

        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
    };

    const markAsRead = (id) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === id ? { ...notification, read: true } : notification
            )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
        setUnreadCount(prev => {
            const notification = notifications.find(n => n.id === id);
            return notification && !notification.read ? Math.max(0, prev - 1) : prev;
        });
    };

    // Clean up old notifications periodically
    useEffect(() => {
        const interval = setInterval(() => {
            const twoDaysAgo = new Date();
            twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

            setNotifications(prev =>
                prev.filter(notification => new Date(notification.timestamp) > twoDaysAgo)
            );
        }, 60000); // Clean up every minute

        return () => clearInterval(interval);
    }, []);

    return {
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        hasUnread: unreadCount > 0
    };
};