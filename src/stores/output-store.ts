import { create } from 'zustand';

export interface OutputLog {
    text: string;
    timestamp: number;
}

interface OutputStore {
    logs: OutputLog[];
    appendOutput: (text: string) => void;
    clearOutput: () => void;
}

export const useOutputStore = create<OutputStore>((set) => ({
    logs: [],
    appendOutput: (text) =>
        set((state) => ({
            logs: [...state.logs, { text, timestamp: Date.now() }],
        })),
    clearOutput: () => set({ logs: [] }),
}));
