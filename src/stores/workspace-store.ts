import { create } from 'zustand';
import { FileEntry } from '../../shared/types';

interface WorkspaceState {
    rootPath: string | null;
    fileTree: FileEntry[];
    openFolder: () => Promise<void>;
    refreshTree: () => Promise<void>;
    setRootPath: (path: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
    rootPath: null,
    fileTree: [],

    setRootPath: (path: string) => set({ rootPath: path }),

    openFolder: async () => {
        const result = await window.electronAPI.openFolder();
        if (!result.success || !result.data) return;
        set({ rootPath: result.data });
        // Read the directory tree
        const treeResult = await window.electronAPI.readDirectory(result.data);
        if (treeResult.success && treeResult.data) {
            set({ fileTree: treeResult.data });
        }
    },

    refreshTree: async () => {
        const { rootPath } = get();
        if (!rootPath) return;
        const result = await window.electronAPI.readDirectory(rootPath);
        if (result.success && result.data) {
            set({ fileTree: result.data });
        }
    },
}));
