import { useState, useCallback } from 'react';

export interface NotificationToast {
    id: string;
    type: 'new_notification' | 'urgent_notification';
    title: string;
    message: string;
    duration?: number;
}

export function useNotificationToasts() {
    const [toasts, setToasts] = useState<NotificationToast[]>([]);

    const addToast = useCallback((toast: Omit<NotificationToast, 'id'>) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newToast: NotificationToast = {
            ...toast,
            id,
            duration: toast.duration || 5000
        };

        setToasts(prev => [...prev, newToast]);

        // Auto-remove toast after duration
        setTimeout(() => {
            removeToast(id);
        }, newToast.duration);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showNewClaimToast = useCallback((claimTitle: string, userName: string, isUrgent: boolean = false) => {
        addToast({
            type: isUrgent ? 'urgent_notification' : 'new_notification',
            title: isUrgent ? '🚨 Reclamo Urgente' : '📝 Nuevo Reclamo',
            message: `${userName} creó un reclamo: "${claimTitle}"`,
            duration: isUrgent ? 8000 : 5000 // Urgentes duran más tiempo
        });
    }, [addToast]);

    const clearAllToasts = useCallback(() => {
        setToasts([]);
    }, []);

    return {
        toasts,
        addToast,
        removeToast,
        showNewClaimToast,
        clearAllToasts
    };
}

export default useNotificationToasts;