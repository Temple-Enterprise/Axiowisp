import { useEffect } from 'react';
import { useUiStore } from '../stores/ui-store';
import { useWorkspaceStore } from '../stores/workspace-store';
import { useTabsStore } from '../stores/tabs-store';

export function useMenuActions(): void {
    const toggleSidebar = useUiStore((s) => s.toggleSidebar);
    const toggleBottomPanel = useUiStore((s) => s.toggleBottomPanel);
    const toggleChatPanel = useUiStore((s) => s.toggleChatPanel);
    const openCommandPalette = useUiStore((s) => s.openCommandPalette);
    const openFolder = useWorkspaceStore((s) => s.openFolder);
    const saveActiveTab = useTabsStore((s) => s.saveActiveTab);
    const closeAllTabs = useTabsStore((s) => s.closeAllTabs);

    useEffect(() => {
        if (!window.electronAPI) return;

        const unsubOpenFolder = window.electronAPI.onMenuOpenFolder(() => {
            openFolder();
        });

        const unsubSave = window.electronAPI.onMenuSave(() => {
            saveActiveTab();
        });

        const unsubSidebar = window.electronAPI.onMenuToggleSidebar(() => {
            toggleSidebar();
        });

        const unsubBottom = window.electronAPI.onMenuToggleBottomPanel(() => {
            toggleBottomPanel();
        });

        const unsubChat = window.electronAPI.onMenuToggleChat(() => {
            toggleChatPanel();
        });

        const unsubCmd = window.electronAPI.onMenuCommandPalette(() => {
            openCommandPalette();
        });

        const unsubWelcome = window.electronAPI.onMenuWelcome(() => {
            closeAllTabs();
        });

        return () => {
            unsubOpenFolder();
            unsubSave();
            unsubSidebar();
            unsubBottom();
            unsubChat();
            unsubCmd();
            unsubWelcome();
        };
    }, [
        toggleSidebar,
        toggleBottomPanel,
        toggleChatPanel,
        openCommandPalette,
        openFolder,
        saveActiveTab,
        closeAllTabs,
    ]);
}
