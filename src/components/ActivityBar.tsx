import React from 'react';
import { useUiStore, Activity } from '../stores/ui-store';
import {
    Files, Search, Play, MessageSquare, Settings,
} from 'lucide-react';
import './ActivityBar.css';

interface ActivityItem {
    id: Activity | 'chat';
    icon: React.ReactNode;
    label: string;
}

const topItems: ActivityItem[] = [
    { id: 'explorer', icon: <Files size={22} />, label: 'Explorer' },
    { id: 'search', icon: <Search size={22} />, label: 'Search' },
    { id: 'run', icon: <Play size={22} />, label: 'Run' },
];

export const ActivityBar: React.FC = () => {
    const activeActivity = useUiStore((s) => s.activeActivity);
    const sidebarVisible = useUiStore((s) => s.sidebarVisible);
    const setActiveActivity = useUiStore((s) => s.setActiveActivity);
    const toggleSidebar = useUiStore((s) => s.toggleSidebar);
    const toggleChatPanel = useUiStore((s) => s.toggleChatPanel);
    const chatPanelVisible = useUiStore((s) => s.chatPanelVisible);
    const toggleSettings = useUiStore((s) => s.toggleSettings);

    const handleClick = (id: Activity | 'chat') => {
        if (id === 'chat') {
            toggleChatPanel();
            return;
        }
        if (activeActivity === id && sidebarVisible) {
            toggleSidebar();
        } else {
            setActiveActivity(id as Activity);
        }
    };

    return (
        <div className="activitybar">
            <div className="activitybar__top">
                {topItems.map((item) => (
                    <button
                        key={item.id}
                        className={`activitybar__btn ${activeActivity === item.id && sidebarVisible ? 'activitybar__btn--active' : ''
                            }`}
                        onClick={() => handleClick(item.id)}
                        title={item.label}
                    >
                        {item.icon}
                    </button>
                ))}
            </div>
            <div className="activitybar__bottom">
                <button
                    className={`activitybar__btn ${chatPanelVisible ? 'activitybar__btn--active' : ''}`}
                    onClick={() => handleClick('chat')}
                    title="AI Chat"
                >
                    <MessageSquare size={22} />
                </button>
                <button
                    className="activitybar__btn"
                    onClick={toggleSettings}
                    title="Settings"
                >
                    <Settings size={22} />
                </button>
            </div>
        </div>
    );
};
