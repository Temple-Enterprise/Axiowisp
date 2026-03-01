import React from 'react';
import { useNotificationStore, Notification } from '../stores/notification-store';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import './ToastContainer.css';

const iconMap: Record<Notification['type'], React.FC<any>> = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: AlertCircle,
};

export const ToastContainer: React.FC = () => {
    const notifications = useNotificationStore((s) => s.notifications);
    const removeNotification = useNotificationStore((s) => s.removeNotification);

    if (notifications.length === 0) return null;

    return (
        <div className="toast-container">
            {notifications.map((n) => {
                const Icon = iconMap[n.type];
                return (
                    <div key={n.id} className={`toast toast--${n.type}`}>
                        <Icon size={14} className="toast__icon" />
                        <span className="toast__message">{n.message}</span>
                        <button className="toast__close" onClick={() => removeNotification(n.id)}>
                            <X size={12} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};
