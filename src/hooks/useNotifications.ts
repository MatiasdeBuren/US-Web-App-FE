import { useState, useEffect, useCallback, useRef } from 'react';
import type { Notification } from '../components/NotificationBell';

interface UseNotificationsOptions {
    token: string | null;
    pollInterval?: number; // en milisegundos
    onNewNotification?: (notification: Notification) => void;
}

// Estructura de respuesta del backend
interface BackendNotification {
    id: string;
    type: 'urgent_claim' | 'new_claim';
    isRead: boolean;
    createdAt: string;
    readAt: string | null;
    claim: {
        id: string;
        title: string;
        priority: string;
        user: {
            name: string;
        };
    };
}

interface NotificationsResponse {
    notifications: BackendNotification[];
    unreadCount: number;
}

export function useNotifications({ token, pollInterval = 30000, onNewNotification }: UseNotificationsOptions) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
    const previousNotificationIds = useRef<Set<string>>(new Set());

    // Convertir notificación del backend al formato del frontend
    const convertBackendNotification = useCallback((backendNotif: BackendNotification): Notification => {
        const isUrgent = backendNotif.type === 'urgent_claim';
        
        return {
            id: backendNotif.id,
            type: backendNotif.type,
            title: isUrgent ? '🚨 Reclamo Urgente' : '📝 Nuevo Reclamo',
            message: `${backendNotif.claim.user.name} creó un reclamo: "${backendNotif.claim.title}"`,
            createdAt: backendNotif.createdAt,
            isRead: backendNotif.isRead,
            claimId: backendNotif.claim.id,
            priority: backendNotif.claim.priority as 'low' | 'medium' | 'high' | 'urgent'
        };
    }, []);

    // Obtener notificaciones desde el backend
    const fetchNotifications = useCallback(async () => {
        if (!token) return;

        try {
            setLoading(true);
            const API_URL = import.meta.env.VITE_API_URL as string;
            
            const response = await fetch(`${API_URL}/admin/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Error fetching notifications');
            
            const data: NotificationsResponse = await response.json();
            
            // Convertir notificaciones del backend al formato del frontend
            const convertedNotifications = data.notifications.map(convertBackendNotification);
            
            // Detectar nuevas notificaciones si ya tenemos notificaciones previas
            if (previousNotificationIds.current.size > 0 && onNewNotification) {
                convertedNotifications.forEach(notification => {
                    if (!previousNotificationIds.current.has(notification.id) && !notification.isRead) {
                        onNewNotification(notification);
                    }
                });
            }
            
            // Actualizar IDs previos
            previousNotificationIds.current = new Set(convertedNotifications.map(n => n.id));
            
            // Ordenar por fecha (más recientes primero)
            convertedNotifications.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setNotifications(convertedNotifications);
            setUnreadCount(data.unreadCount);
            setLastCheckTime(new Date());
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [token, convertBackendNotification]);

    // Marcar notificación como leída
    const markAsRead = useCallback(async (notificationId: string) => {
        if (!token) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL as string;
            
            const response = await fetch(`${API_URL}/admin/notifications/${notificationId}/mark-read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Error marking notification as read');

            // Actualizar estado local
            setNotifications(prev => prev.map(notification => 
                notification.id === notificationId 
                    ? { ...notification, isRead: true }
                    : notification
            ));

            // Actualizar contador
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }, [token]);

    // Marcar todas como leídas
    const markAllAsRead = useCallback(async () => {
        if (!token) return;

        try {
            const API_URL = import.meta.env.VITE_API_URL as string;
            
            const response = await fetch(`${API_URL}/admin/notifications/mark-all-read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) throw new Error('Error marking all notifications as read');

            // Actualizar estado local
            setNotifications(prev => prev.map(notification => 
                ({ ...notification, isRead: true })
            ));

            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }, [token]);

    // Polling automático
    useEffect(() => {
        if (!token) return;

        // Fetch inicial
        fetchNotifications();

        // Setup polling
        const interval = setInterval(fetchNotifications, pollInterval);
        
        return () => clearInterval(interval);
    }, [token, fetchNotifications, pollInterval]);

    // Refresh manual
    const refresh = useCallback(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        lastCheckTime,
        markAsRead,
        markAllAsRead,
        refresh
    };
}

export default useNotifications;