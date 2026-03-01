import { create } from 'zustand';
import { GitFileStatus, GitStatus } from '../../shared/types';

interface GitState {
    branch: string;
    files: GitFileStatus[];
    isLoading: boolean;
    error: string | null;
    commitMessage: string;
    setCommitMessage: (msg: string) => void;
    refresh: () => Promise<void>;
    stage: (filePath: string) => Promise<void>;
    unstage: (filePath: string) => Promise<void>;
    commit: () => Promise<void>;
    push: () => Promise<void>;
    pull: () => Promise<void>;
}

export const useGitStore = create<GitState>((set, get) => ({
    branch: '',
    files: [],
    isLoading: false,
    error: null,
    commitMessage: '',

    setCommitMessage: (msg) => set({ commitMessage: msg }),

    refresh: async () => {
        try {
            const { useWorkspaceStore } = await import('./workspace-store');
            const rootPath = useWorkspaceStore.getState().rootPath;
            if (!rootPath || !window.electronAPI?.gitStatus) return;

            set({ isLoading: true, error: null });
            const result = await window.electronAPI.gitStatus(rootPath);
            if (result.success && result.data) {
                const data = result.data as GitStatus;
                set({ branch: data.branch, files: data.files, isLoading: false });
            } else {
                set({ branch: '', files: [], isLoading: false, error: result.error || 'Not a git repo' });
            }
        } catch (err: any) {
            set({ isLoading: false, error: err.message });
        }
    },

    stage: async (filePath) => {
        const { useWorkspaceStore } = await import('./workspace-store');
        const rootPath = useWorkspaceStore.getState().rootPath;
        if (!rootPath) return;
        await window.electronAPI.gitStage(rootPath, filePath);
        await get().refresh();
    },

    unstage: async (filePath) => {
        const { useWorkspaceStore } = await import('./workspace-store');
        const rootPath = useWorkspaceStore.getState().rootPath;
        if (!rootPath) return;
        await window.electronAPI.gitUnstage(rootPath, filePath);
        await get().refresh();
    },

    commit: async () => {
        const { commitMessage } = get();
        if (!commitMessage.trim()) return;
        const { useWorkspaceStore } = await import('./workspace-store');
        const rootPath = useWorkspaceStore.getState().rootPath;
        if (!rootPath) return;
        const result = await window.electronAPI.gitCommit(rootPath, commitMessage);
        if (result.success) {
            set({ commitMessage: '' });
            const { useNotificationStore } = await import('./notification-store');
            useNotificationStore.getState().addNotification('Changes committed', 'success');
        }
        await get().refresh();
    },

    push: async () => {
        const { useWorkspaceStore } = await import('./workspace-store');
        const rootPath = useWorkspaceStore.getState().rootPath;
        if (!rootPath) return;
        set({ isLoading: true });
        const result = await window.electronAPI.gitPush(rootPath);
        if (result.success) {
            const { useNotificationStore } = await import('./notification-store');
            useNotificationStore.getState().addNotification('Pushed to remote', 'success');
        } else {
            const { useNotificationStore } = await import('./notification-store');
            useNotificationStore.getState().addNotification(`Push failed: ${result.error}`, 'error');
        }
        set({ isLoading: false });
    },

    pull: async () => {
        const { useWorkspaceStore } = await import('./workspace-store');
        const rootPath = useWorkspaceStore.getState().rootPath;
        if (!rootPath) return;
        set({ isLoading: true });
        const result = await window.electronAPI.gitPull(rootPath);
        if (result.success) {
            const { useNotificationStore } = await import('./notification-store');
            useNotificationStore.getState().addNotification('Pulled from remote', 'success');
        } else {
            const { useNotificationStore } = await import('./notification-store');
            useNotificationStore.getState().addNotification(`Pull failed: ${result.error}`, 'error');
        }
        set({ isLoading: false });
        await get().refresh();
    },
}));
