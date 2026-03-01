import { create } from 'zustand';

export interface Notification {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
}

interface NotificationState {
    notifications: Notification[];
    addNotification: (message: string, type?: Notification['type'], duration?: number) => void;
    removeNotification: (id: string) => void;
}

let notifId = 0;

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],

    addNotification: (message, type = 'info', duration = 3000) => {
        const id = `notif-${++notifId}`;
        const notif: Notification = { id, message, type, duration };

        set((s) => ({
            notifications: [...s.notifications, notif],
        }));

        if (duration > 0) {
            setTimeout(() => {
                set((s) => ({
                    notifications: s.notifications.filter((n) => n.id !== id),
                }));
            }, duration);
        }
    },

    removeNotification: (id) =>
        set((s) => ({
            notifications: s.notifications.filter((n) => n.id !== id),
        })),
}));
