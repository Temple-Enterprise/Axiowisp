import { create } from 'zustand';

export type Activity = 'explorer' | 'search' | 'run' | 'git' | 'api' | 'snippets' | 'notepad';

interface UiState {
    sidebarVisible: boolean;
    bottomPanelVisible: boolean;
    chatPanelVisible: boolean;
    commandPaletteOpen: boolean;
    settingsOpen: boolean;
    aboutModalOpen: boolean;
    aboutData: any;
    bottomPanelTab: 'terminal' | 'output' | 'problems';
    activeActivity: Activity;
    pendingCloseTabId: string | null;
    zenMode: boolean;
    notificationsPanelOpen: boolean;
    toggleSidebar: () => void;
    toggleBottomPanel: () => void;
    toggleChatPanel: () => void;
    openCommandPalette: () => void;
    closeCommandPalette: () => void;
    setBottomPanelTab: (tab: 'terminal' | 'output' | 'problems') => void;
    setActiveActivity: (activity: Activity) => void;
    toggleSettings: () => void;
    toggleAboutModal: (isOpen: boolean, data?: any) => void;
    setPendingCloseTabId: (tabId: string | null) => void;
    toggleZenMode: () => void;
    toggleNotificationsPanel: () => void;
}

export const useUiStore = create<UiState>((set) => ({
    sidebarVisible: true,
    bottomPanelVisible: false,
    chatPanelVisible: false,
    commandPaletteOpen: false,
    settingsOpen: false,
    aboutModalOpen: false,
    aboutData: null,
    bottomPanelTab: 'terminal',
    activeActivity: 'explorer',
    pendingCloseTabId: null,
    zenMode: false,
    notificationsPanelOpen: false,

    toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
    toggleBottomPanel: () => set((s) => ({ bottomPanelVisible: !s.bottomPanelVisible })),
    toggleChatPanel: () => set((s) => ({ chatPanelVisible: !s.chatPanelVisible })),
    openCommandPalette: () => set({ commandPaletteOpen: true }),
    closeCommandPalette: () => set({ commandPaletteOpen: false }),
    setBottomPanelTab: (tab) => set({ bottomPanelTab: tab }),
    setActiveActivity: (activity) => set({ activeActivity: activity, sidebarVisible: true }),
    toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
    toggleAboutModal: (isOpen, data) => set({ aboutModalOpen: isOpen, aboutData: data || null }),
    setPendingCloseTabId: (tabId) => set({ pendingCloseTabId: tabId }),
    toggleZenMode: () => set((s) => ({
        zenMode: !s.zenMode,
        sidebarVisible: s.zenMode ? true : false,
        bottomPanelVisible: false,
        chatPanelVisible: false,
    })),
    toggleNotificationsPanel: () => set((s) => ({ notificationsPanelOpen: !s.notificationsPanelOpen })),
}));

