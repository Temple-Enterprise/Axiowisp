import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTabsStore } from '../stores/tabs-store';
import { getFileIcon } from '../utils/file-icons';
import { X } from 'lucide-react';
import './TabBar.css';

export const TabBar: React.FC = () => {
    const tabs = useTabsStore((s) => s.tabs);
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const setActiveTab = useTabsStore((s) => s.setActiveTab);
    const closeTab = useTabsStore((s) => s.closeTab);
    const closeAllTabs = useTabsStore((s) => s.closeAllTabs);
    const closeOtherTabs = useTabsStore((s) => s.closeOtherTabs);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, tabId });
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        };
        if (contextMenu) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [contextMenu]);

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
                            onContextMenu={(e) => handleContextMenu(e, tab.id)}
                            title={tab.filePath}
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

            {/* Context menu */}
            {contextMenu && (
                <div
                    ref={menuRef}
                    className="tabbar__context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    <button
                        className="tabbar__context-item"
                        onClick={() => { closeTab(contextMenu.tabId); setContextMenu(null); }}
                    >
                        Close
                    </button>
                    <button
                        className="tabbar__context-item"
                        onClick={() => { closeOtherTabs(contextMenu.tabId); setContextMenu(null); }}
                    >
                        Close Others
                    </button>
                    <button
                        className="tabbar__context-item"
                        onClick={() => { closeAllTabs(); setContextMenu(null); }}
                    >
                        Close All
                    </button>
                </div>
            )}
        </div>
    );
};
