import { create } from 'zustand';
import { Tab } from '../../shared/types';

// Map file extension → Monaco language id
function detectLanguage(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = {
        ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
        json: 'json', html: 'html', css: 'css', scss: 'scss', less: 'less',
        md: 'markdown', py: 'python', rs: 'rust', go: 'go', java: 'java',
        c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp', cs: 'csharp',
        rb: 'ruby', php: 'php', sh: 'shell', bash: 'shell', zsh: 'shell',
        yml: 'yaml', yaml: 'yaml', toml: 'ini', xml: 'xml', svg: 'xml',
        sql: 'sql', graphql: 'graphql', dockerfile: 'dockerfile',
        makefile: 'makefile', lua: 'lua', swift: 'swift', kt: 'kotlin',
    };
    return map[ext] ?? 'plaintext';
}

interface TabsState {
    tabs: Tab[];
    activeTabId: string | null;
    openTab: (filePath: string) => Promise<void>;
    closeTab: (tabId: string) => void;
    closeAllTabs: () => void;
    closeOtherTabs: (keepTabId: string) => void;
    setActiveTab: (tabId: string) => void;
    markDirty: (tabId: string) => void;
    markClean: (tabId: string) => void;
    updateContent: (tabId: string, content: string) => void;
    saveActiveTab: () => Promise<void>;
}

export const useTabsStore = create<TabsState>((set, get) => ({
    tabs: [],
    activeTabId: null,

    openTab: async (filePath: string) => {
        const { tabs } = get();
        // If already open, just activate
        const existing = tabs.find((t) => t.filePath === filePath);
        if (existing) {
            set({ activeTabId: existing.id });
            return;
        }

        // Read file content from main process
        const result = await window.electronAPI.readFile(filePath);
        if (!result.success) {
            console.error('Failed to read file:', result.error);
            return;
        }

        const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
        const newTab: Tab = {
            id: filePath,
            filePath,
            fileName,
            content: result.data ?? '',
            isDirty: false,
            language: detectLanguage(fileName),
        };

        set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id,
        }));
    },

    closeTab: (tabId: string) => {
        set((state) => {
            const idx = state.tabs.findIndex((t) => t.id === tabId);
            const newTabs = state.tabs.filter((t) => t.id !== tabId);
            let newActive = state.activeTabId;

            if (state.activeTabId === tabId) {
                if (newTabs.length === 0) {
                    newActive = null;
                } else {
                    newActive = newTabs[Math.min(idx, newTabs.length - 1)].id;
                }
            }

            return { tabs: newTabs, activeTabId: newActive };
        });
    },

    closeAllTabs: () => set({ tabs: [], activeTabId: null }),

    closeOtherTabs: (keepTabId: string) =>
        set((state) => ({
            tabs: state.tabs.filter((t) => t.id === keepTabId),
            activeTabId: keepTabId,
        })),

    setActiveTab: (tabId: string) => set({ activeTabId: tabId }),

    markDirty: (tabId: string) =>
        set((state) => ({
            tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, isDirty: true } : t)),
        })),

    markClean: (tabId: string) =>
        set((state) => ({
            tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, isDirty: false } : t)),
        })),

    updateContent: (tabId: string, content: string) =>
        set((state) => ({
            tabs: state.tabs.map((t) =>
                t.id === tabId ? { ...t, content, isDirty: true } : t,
            ),
        })),

    saveActiveTab: async () => {
        const { tabs, activeTabId } = get();
        const tab = tabs.find((t) => t.id === activeTabId);
        if (!tab) return;

        const result = await window.electronAPI.writeFile(tab.filePath, tab.content);
        if (result.success) {
            set((state) => ({
                tabs: state.tabs.map((t) => (t.id === tab.id ? { ...t, isDirty: false } : t)),
            }));
        } else {
            console.error('Failed to save file:', result.error);
        }
    },
}));
