import React from 'react';
import { useNotificationStore } from '../stores/notification-store';
import { useUiStore } from '../stores/ui-store';
import { X, Trash2, Bell, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import './NotificationsPanel.css';

export const NotificationsPanel: React.FC = () => {
    const history = useNotificationStore((s) => s.history);
    const clearHistory = useNotificationStore((s) => s.clearHistory);
    const toggleNotificationsPanel = useUiStore((s) => s.toggleNotificationsPanel);

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={14} className="notif-panel__icon notif-panel__icon--success" />;
            case 'warning': return <AlertTriangle size={14} className="notif-panel__icon notif-panel__icon--warning" />;
            case 'error': return <AlertCircle size={14} className="notif-panel__icon notif-panel__icon--error" />;
            default: return <Info size={14} className="notif-panel__icon notif-panel__icon--info" />;
        }
    };

    return (
        <div className="notif-panel__overlay" onClick={toggleNotificationsPanel}>
            <div className="notif-panel" onClick={(e) => e.stopPropagation()}>
                <div className="notif-panel__header">
                    <Bell size={14} />
                    <span className="notif-panel__title">Notifications</span>
                    <span className="notif-panel__count">{history.length}</span>
                    <div className="notif-panel__actions">
                        <button className="notif-panel__action" onClick={clearHistory} title="Clear All">
                            <Trash2 size={14} />
                        </button>
                        <button className="notif-panel__action" onClick={toggleNotificationsPanel}>
                            <X size={14} />
                        </button>
                    </div>
                </div>
                <div className="notif-panel__list">
                    {history.length === 0 ? (
                        <div className="notif-panel__empty">No notifications yet</div>
                    ) : (
                        [...history].reverse().map((n) => (
                            <div key={n.id} className={`notif-panel__item notif-panel__item--${n.type}`}>
                                {getIcon(n.type)}
                                <span className="notif-panel__message">{n.message}</span>
                                <span className="notif-panel__time">
                                    {n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : ''}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
