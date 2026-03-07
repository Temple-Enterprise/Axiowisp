import { create } from 'zustand';
import { Tab } from '../../shared/types';

function detectLanguage(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

    const mediaMap: Record<string, string> = {
        png: 'image', jpg: 'image', jpeg: 'image', gif: 'image',
        webp: 'image', ico: 'image', svg: 'image',
        mp4: 'video', webm: 'video', ogg: 'video'
    };
    if (mediaMap[ext]) return mediaMap[ext];

    const map: Record<string, string> = {
        ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
        json: 'json', html: 'html', css: 'css', scss: 'scss', less: 'less',
        md: 'markdown', py: 'python', rs: 'rust', go: 'go', java: 'java',
        c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp', cs: 'csharp',
        rb: 'ruby', php: 'php', sh: 'shell', bash: 'shell', zsh: 'shell',
        yml: 'yaml', yaml: 'yaml', toml: 'ini', xml: 'xml',
        sql: 'sql', graphql: 'graphql', dockerfile: 'dockerfile',
        makefile: 'makefile', lua: 'lua', swift: 'swift', kt: 'kotlin',
    };
    return map[ext] ?? 'plaintext';
}

interface ClosedTabEntry {
    filePath: string;
    content: string;
}

interface TabsState {
    tabs: Tab[];
    activeTabId: string | null;
    closedTabs: ClosedTabEntry[];
    openTab: (filePath: string) => Promise<void>;
    closeTab: (tabId: string) => void;
    closeActiveTab: () => void;
    closeAllTabs: () => void;
    closeOtherTabs: (keepTabId: string) => void;
    setActiveTab: (tabId: string) => void;
    markDirty: (tabId: string) => void;
    markClean: (tabId: string) => void;
    updateContent: (tabId: string, content: string) => void;
    saveActiveTab: () => Promise<void>;
    renameTab: (oldPath: string, newPath: string) => void;
    refreshTab: (filePath: string) => Promise<void>;
    closeTabsToRight: (tabId: string) => void;
    closeSavedTabs: () => void;
    reorderTabs: (fromIndex: number, toIndex: number) => void;
    reopenClosedTab: () => Promise<void>;
    activateNextTab: () => void;
    activatePreviousTab: () => void;
    recentFiles: string[];
    pinTab: (tabId: string) => void;
    unpinTab: (tabId: string) => void;
    openDashboard: () => void;
    openDiff: (filePath: string, originalContent: string, modifiedContent: string, language: string) => void;
}

export const useTabsStore = create<TabsState>((set, get) => ({
    tabs: [],
    activeTabId: null,
    closedTabs: [],
    recentFiles: [] as string[],

    openTab: async (filePath: string) => {
        const { tabs } = get();
        const existing = tabs.find((t) => t.filePath === filePath);
        if (existing) {
            set({ activeTabId: existing.id });
            return;
        }

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

        try {
            const { useActivityStore } = await import('./activity-store');
            useActivityStore.getState().addEvent('file-open', `Opened ${fileName}`);
        } catch { /* ignore */ }
    },

    closeTab: (tabId: string) => {
        set((state) => {
            const closingTab = state.tabs.find((t) => t.id === tabId);
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

            const newClosed = [...state.closedTabs];
            if (closingTab && closingTab.filePath !== 'dashboard' && !closingTab.filePath.startsWith('diff:')) {
                newClosed.push({ filePath: closingTab.filePath, content: closingTab.content });
                if (newClosed.length > 20) newClosed.shift();
            }

            return { tabs: newTabs, activeTabId: newActive, closedTabs: newClosed };
        });
    },

    closeActiveTab: () => {
        const { activeTabId, closeTab } = get();
        if (activeTabId) closeTab(activeTabId);
    },

    closeAllTabs: () => set({ tabs: [], activeTabId: null, closedTabs: [] }),

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
            try {
                const { useActivityStore } = await import('./activity-store');
                useActivityStore.getState().addEvent('file-save', `Saved ${tab.fileName}`);
            } catch { /* ignore */ }
        } else {
            console.error('Failed to save file:', result.error);
        }
    },

    renameTab: (oldPath: string, newPath: string) => {
        const newFileName = newPath.split(/[\\/]/).pop() ?? newPath;
        set((state) => ({
            tabs: state.tabs.map((t) =>
                t.id === oldPath
                    ? { ...t, id: newPath, filePath: newPath, fileName: newFileName, language: detectLanguage(newFileName) }
                    : t,
            ),
            activeTabId: state.activeTabId === oldPath ? newPath : state.activeTabId,
        }));
    },

    closeTabsToRight: (tabId: string) => {
        set((state) => {
            const idx = state.tabs.findIndex((t) => t.id === tabId);
            if (idx === -1) return state;
            const newTabs = state.tabs.slice(0, idx + 1);
            const newActive = newTabs.find((t) => t.id === state.activeTabId)
                ? state.activeTabId
                : newTabs[newTabs.length - 1]?.id ?? null;
            return { tabs: newTabs, activeTabId: newActive };
        });
    },

    closeSavedTabs: () => {
        set((state) => {
            const newTabs = state.tabs.filter((t) => t.isDirty);
            const newActive = newTabs.find((t) => t.id === state.activeTabId)
                ? state.activeTabId
                : newTabs[0]?.id ?? null;
            return { tabs: newTabs, activeTabId: newActive };
        });
    },

    reorderTabs: (fromIndex: number, toIndex: number) => {
        set((state) => {
            const newTabs = [...state.tabs];
            const [moved] = newTabs.splice(fromIndex, 1);
            newTabs.splice(toIndex, 0, moved);
            return { tabs: newTabs };
        });
    },

    reopenClosedTab: async () => {
        const { closedTabs } = get();
        if (closedTabs.length === 0) return;
        const entry = closedTabs[closedTabs.length - 1];
        set((state) => ({ closedTabs: state.closedTabs.slice(0, -1) }));
        await get().openTab(entry.filePath);
    },

    activateNextTab: () => {
        const { tabs, activeTabId } = get();
        if (tabs.length <= 1) return;
        const idx = tabs.findIndex((t) => t.id === activeTabId);
        const next = (idx + 1) % tabs.length;
        set({ activeTabId: tabs[next].id });
    },

    activatePreviousTab: () => {
        const { tabs, activeTabId } = get();
        if (tabs.length <= 1) return;
        const idx = tabs.findIndex((t) => t.id === activeTabId);
        const prev = (idx - 1 + tabs.length) % tabs.length;
        set({ activeTabId: tabs[prev].id });
    },

    pinTab: (tabId: string) => {
        set((state) => ({
            tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, isPinned: true } : t)),
        }));
    },

    unpinTab: (tabId: string) => {
        set((state) => ({
            tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, isPinned: false } : t)),
        }));
    },

    refreshTab: async (filePath: string) => {
        const { tabs } = get();
        const tab = tabs.find((t) => t.filePath === filePath);
        if (!tab) return;

        const result = await window.electronAPI.readFile(filePath);
        if (result.success && result.data !== undefined) {
            set((state) => ({
                tabs: state.tabs.map((t) =>
                    t.filePath === filePath ? { ...t, content: result.data!, isDirty: false } : t,
                ),
            }));
        }
    },

    openDashboard: () => {
        set((state) => {
            const existing = state.tabs.find((t) => t.id === 'dashboard');
            if (existing) return { activeTabId: 'dashboard' };
            return {
                tabs: [...state.tabs, {
                    id: 'dashboard',
                    filePath: 'dashboard',
                    fileName: 'Dashboard',
                    content: '',
                    isDirty: false,
                    language: 'plaintext',
                }],
                activeTabId: 'dashboard',
            };
        });
    },

    openDiff: (filePath, originalContent, modifiedContent, language) => {
        const tabId = `diff:${filePath}`;
        set((state) => {
            const existing = state.tabs.find((t) => t.id === tabId);
            if (existing) return { activeTabId: tabId };
            const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
            return {
                tabs: [...state.tabs, {
                    id: tabId,
                    filePath,
                    fileName: `${fileName} (diff)`,
                    content: modifiedContent,
                    originalContent,
                    isDirty: false,
                    language: `diff:${language}`,
                }],
                activeTabId: tabId,
            };
        });
    },
}));
