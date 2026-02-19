import React from 'react';
import { useTabsStore } from '../stores/tabs-store';
import { getFileIcon } from '../utils/file-icons';
import { X } from 'lucide-react';
import './TabBar.css';

export const TabBar: React.FC = () => {
    const tabs = useTabsStore((s) => s.tabs);
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const setActiveTab = useTabsStore((s) => s.setActiveTab);
    const closeTab = useTabsStore((s) => s.closeTab);

    return (
        <div className="tabbar">
            <div className="tabbar__tabs">
                {tabs.map((tab) => {
                    const isActive = tab.id === activeTabId;
                    const iconInfo = getFileIcon(tab.fileName, false);
                    const Icon = iconInfo.icon;

                    return (
                        <div
                            key={tab.id}
                            className={`tabbar__tab ${isActive ? 'tabbar__tab--active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={14} color={iconInfo.color} className="tabbar__tab-icon" />
                            <span className="tabbar__tab-name">{tab.fileName}</span>
                            {tab.isDirty && <span className="tabbar__tab-dot" />}
                            <button
                                className="tabbar__tab-close"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeTab(tab.id);
                                }}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
