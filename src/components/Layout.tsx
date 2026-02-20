import React, { useCallback, useRef, useEffect } from 'react';
import { ActivityBar } from './ActivityBar';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { Editor } from './Editor';
import { BottomPanel } from './BottomPanel';
import { ChatPanel } from './ChatPanel';
import { StatusBar } from './StatusBar';
import { CommandPalette } from './CommandPalette';
import { SettingsModal } from './SettingsModal';
import { AboutModal } from './AboutModal';
import { WelcomeTab } from './WelcomeTab';
import { useUiStore } from '../stores/ui-store';
import { useTabsStore } from '../stores/tabs-store';
import { useSettingsStore } from '../stores/settings-store';
import './Layout.css';

export const Layout: React.FC = () => {
    const sidebarVisible = useUiStore((s) => s.sidebarVisible);
    const bottomPanelVisible = useUiStore((s) => s.bottomPanelVisible);
    const chatPanelVisible = useUiStore((s) => s.chatPanelVisible);
    const commandPaletteOpen = useUiStore((s) => s.commandPaletteOpen);
    const settingsOpen = useUiStore((s) => s.settingsOpen);
    const aboutModalOpen = useUiStore((s) => s.aboutModalOpen);
    const activeTabId = useTabsStore((s) => s.activeTabId);

    const theme = useSettingsStore((s) => s.theme);
    const sidebarWidth = useSettingsStore((s) => s.sidebarWidth);
    const bottomPanelHeight = useSettingsStore((s) => s.bottomPanelHeight);
    const chatPanelWidth = useSettingsStore((s) => s.chatPanelWidth);
    const setSidebarWidth = useSettingsStore((s) => s.setSidebarWidth);
    const setBottomPanelHeight = useSettingsStore((s) => s.setBottomPanelHeight);
    const setChatPanelWidth = useSettingsStore((s) => s.setChatPanelWidth);
    const toggleAboutModal = useUiStore((s) => s.toggleAboutModal);

    useEffect(() => {
        window.electronAPI.onAbout((data) => {
            toggleAboutModal(true, data);
        });
    }, [toggleAboutModal]);

    // Sync theme class to the global body element so scrollbars and overlays inherit it.
    useEffect(() => {
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${theme}`);
    }, [theme]);

    const draggingRef = useRef<'sidebar' | 'bottom' | 'chat' | null>(null);

    const handleSidebarDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        draggingRef.current = 'sidebar';
        const startX = e.clientX;
        const startWidth = sidebarWidth;

        const onMove = (ev: MouseEvent) => {
            const delta = ev.clientX - startX;
            const newWidth = Math.max(160, Math.min(480, startWidth + delta));
            setSidebarWidth(newWidth);
        };
        const onUp = () => {
            draggingRef.current = null;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [sidebarWidth, setSidebarWidth]);

    const handleBottomDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        draggingRef.current = 'bottom';
        const startY = e.clientY;
        const startHeight = bottomPanelHeight;

        const onMove = (ev: MouseEvent) => {
            const delta = startY - ev.clientY;
            const newHeight = Math.max(100, Math.min(600, startHeight + delta));
            setBottomPanelHeight(newHeight);
        };
        const onUp = () => {
            draggingRef.current = null;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [bottomPanelHeight, setBottomPanelHeight]);

    const handleChatDragStart = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        draggingRef.current = 'chat';
        const startX = e.clientX;
        const startWidth = chatPanelWidth;

        const onMove = (ev: MouseEvent) => {
            const delta = startX - ev.clientX; // dragging left = wider
            const newWidth = Math.max(280, Math.min(700, startWidth + delta));
            setChatPanelWidth(newWidth);
        };
        const onUp = () => {
            draggingRef.current = null;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [chatPanelWidth, setChatPanelWidth]);

    // Build CSS custom properties for dynamic sizes
    const layoutStyle: React.CSSProperties = {
        '--dynamic-sidebar-width': `${sidebarWidth}px`,
        '--dynamic-bottom-height': `${bottomPanelHeight}px`,
        '--dynamic-chat-width': `${chatPanelWidth}px`,
    } as React.CSSProperties;

    return (
        <div
            className="layout"
            data-sidebar={sidebarVisible}
            data-bottom={bottomPanelVisible}
            data-chat={chatPanelVisible}
            style={layoutStyle}
        >
            <div className="layout__activitybar">
                <ActivityBar />
            </div>

            {sidebarVisible && (
                <>
                    <aside className="layout__sidebar">
                        <Sidebar />
                    </aside>
                    <div className="layout__sidebar-resize" onMouseDown={handleSidebarDragStart} />
                </>
            )}

            <div className="layout__main">
                <div className="layout__tabbar">
                    <TabBar />
                </div>
                <div className="layout__editor">
                    {activeTabId ? <Editor /> : <WelcomeTab />}
                </div>
                {bottomPanelVisible && (
                    <>
                        <div className="layout__bottom-resize" onMouseDown={handleBottomDragStart} />
                        <div className="layout__bottom" style={{ height: bottomPanelHeight }}>
                            <BottomPanel />
                        </div>
                    </>
                )}
            </div>

            {chatPanelVisible && (
                <>
                    <div className="layout__chat-resize" onMouseDown={handleChatDragStart} />
                    <aside className="layout__chat" style={{ width: chatPanelWidth }}>
                        <ChatPanel />
                    </aside>
                </>
            )}

            <div className="layout__statusbar">
                <StatusBar />
            </div>

            {commandPaletteOpen && <CommandPalette />}
            {settingsOpen && <SettingsModal />}
            {aboutModalOpen && <AboutModal />}
        </div>
    );
};
