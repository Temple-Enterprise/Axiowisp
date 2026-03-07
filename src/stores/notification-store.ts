import { create } from 'zustand';

export interface Notification {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    timestamp?: number;
}

interface NotificationState {
    notifications: Notification[];
    history: Notification[];
    addNotification: (message: string, type?: Notification['type'], duration?: number) => void;
    removeNotification: (id: string) => void;
    clearHistory: () => void;
}

let notifId = 0;

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    history: [],

    addNotification: (message, type = 'info', duration = 3000) => {
        const id = `notif-${++notifId}`;
        const notif: Notification = { id, message, type, duration, timestamp: Date.now() };

        set((s) => ({
            notifications: [...s.notifications, notif],
            history: [...s.history, notif].slice(-100),
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

    clearHistory: () => set({ history: [] }),
}));

