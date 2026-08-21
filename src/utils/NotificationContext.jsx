import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { getMyNotificationsApi, markNotificationReadApi, markAllNotificationsReadApi } from '../Action/api';
import toast from 'react-hot-toast';
import { onMessageListener } from './firebase';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [socket, setSocket] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchNotifications = useCallback(async () => {
        try {
            const { data } = await getMyNotificationsApi();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, []);

    useEffect(() => {
        const userInfoStr = (localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo'));
        if (!userInfoStr) return;
        const userInfo = JSON.parse(userInfoStr);

        const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5003', {
            auth: {
                token: userInfo.token
            }
        });

        newSocket.on('connect', () => {
            console.log('Connected to socket server');
            newSocket.emit('join', userInfo.id);
            newSocket.emit('join_role', userInfo.role);
        });

        newSocket.on('notification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Play notification sound
            const audio = new Audio('/notification.mp3');
            audio.play().catch(err => console.error('Error playing sound:', err));

            toast.success(notification.title, {
                description: notification.message,
                icon: '🔔'
            });

            // Increment refreshKey to trigger data refetch in other components
            setRefreshKey(prev => prev + 1);
        });

        setSocket(newSocket);
        fetchNotifications();

        return () => newSocket.close();
    }, [fetchNotifications]);

    // FCM foreground message listener
    useEffect(() => {
        const listenForMessages = () => {
            onMessageListener()
                .then((payload) => {
                    if (payload && payload.notification) {
                        toast.success(payload.notification.title, {
                            description: payload.notification.body,
                            icon: '🔔'
                        });
                        // Refresh notifications from server
                        fetchNotifications();
                        setRefreshKey(prev => prev + 1);
                    }
                    // Re-register the listener for the next message
                    listenForMessages();
                })
                .catch((err) => console.error('FCM foreground listener error:', err));
        };
        listenForMessages();
    }, [fetchNotifications]);

    const markAsRead = async (id) => {
        try {
            await markNotificationReadApi(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllRead = async () => {
        try {
            await markAllNotificationsReadApi();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllRead,
            fetchNotifications,
            refreshKey
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

