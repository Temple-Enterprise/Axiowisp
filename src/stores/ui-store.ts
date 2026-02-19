import { create } from 'zustand';

export type Activity = 'explorer' | 'search' | 'run';

interface UiState {
    sidebarVisible: boolean;
    bottomPanelVisible: boolean;
    chatPanelVisible: boolean;
    commandPaletteOpen: boolean;
    settingsOpen: boolean;
    aboutModalOpen: boolean;
    aboutData: any;
    bottomPanelTab: 'terminal' | 'output';
    activeActivity: Activity;
    toggleSidebar: () => void;
    toggleBottomPanel: () => void;
    toggleChatPanel: () => void;
    openCommandPalette: () => void;
    closeCommandPalette: () => void;
    setBottomPanelTab: (tab: 'terminal' | 'output') => void;
    setActiveActivity: (activity: Activity) => void;
    toggleSettings: () => void;
    toggleAboutModal: (isOpen: boolean, data?: any) => void;
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

    toggleSidebar: () => set((s) => ({ sidebarVisible: !s.sidebarVisible })),
    toggleBottomPanel: () => set((s) => ({ bottomPanelVisible: !s.bottomPanelVisible })),
    toggleChatPanel: () => set((s) => ({ chatPanelVisible: !s.chatPanelVisible })),
    openCommandPalette: () => set({ commandPaletteOpen: true }),
    closeCommandPalette: () => set({ commandPaletteOpen: false }),
    setBottomPanelTab: (tab) => set({ bottomPanelTab: tab }),
    setActiveActivity: (activity) => set({ activeActivity: activity, sidebarVisible: true }),
    toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
    toggleAboutModal: (isOpen, data) => set({ aboutModalOpen: isOpen, aboutData: data || null }),
}));
