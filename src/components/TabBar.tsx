import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTabsStore } from '../stores/tabs-store';
import { getFileIcon } from '../utils/file-icons';
import { useUiStore } from '../stores/ui-store';
import { X } from 'lucide-react';
import './TabBar.css';

export const TabBar: React.FC = () => {
    const tabs = useTabsStore((s) => s.tabs);
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const setActiveTab = useTabsStore((s) => s.setActiveTab);
    const closeTab = useTabsStore((s) => s.closeTab);
    const closeAllTabs = useTabsStore((s) => s.closeAllTabs);
    const closeOtherTabs = useTabsStore((s) => s.closeOtherTabs);
    const closeTabsToRight = useTabsStore((s) => s.closeTabsToRight);
    const closeSavedTabs = useTabsStore((s) => s.closeSavedTabs);
    const reorderTabs = useTabsStore((s) => s.reorderTabs);
    const setPendingCloseTabId = useUiStore((s) => s.setPendingCloseTabId);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const dragIndexRef = useRef<number>(-1);

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

    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
        dragIndexRef.current = index;
        e.dataTransfer.effectAllowed = 'move';
        (e.target as HTMLElement).classList.add('tabbar__tab--dragging');
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        const fromIndex = dragIndexRef.current;
        if (fromIndex !== -1 && fromIndex !== toIndex) {
            reorderTabs(fromIndex, toIndex);
        }
        dragIndexRef.current = -1;
    }, [reorderTabs]);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        (e.target as HTMLElement).classList.remove('tabbar__tab--dragging');
        dragIndexRef.current = -1;
    }, []);

    return (
        <div className="tabbar">
            <div className="tabbar__tabs">
                {tabs.map((tab, index) => {
                    const isActive = tab.id === activeTabId;
                    const iconInfo = getFileIcon(tab.fileName, false);
                    const Icon = iconInfo.icon;

                    return (
                        <div
                            key={tab.id}
                            className={`tabbar__tab ${isActive ? 'tabbar__tab--active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            onContextMenu={(e) => handleContextMenu(e, tab.id)}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragEnd={handleDragEnd}
                            title={tab.filePath}
                        >
                            <Icon size={14} color={iconInfo.color} className="tabbar__tab-icon" />
                            <span className="tabbar__tab-name">{tab.fileName}</span>
                            {tab.isDirty && <span className="tabbar__tab-dot" />}
                            <button
                                className="tabbar__tab-close"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const t = tabs.find((t) => t.id === tab.id);
                                    if (t?.isDirty) {
                                        setPendingCloseTabId(tab.id);
                                    } else {
                                        closeTab(tab.id);
                                    }
                                }}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    );
                })}
            </div>

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
                        onClick={() => { closeTabsToRight(contextMenu.tabId); setContextMenu(null); }}
                    >
                        Close to the Right
                    </button>
                    <button
                        className="tabbar__context-item"
                        onClick={() => { closeSavedTabs(); setContextMenu(null); }}
                    >
                        Close Saved
                    </button>
                    <div className="tabbar__context-separator" />
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
