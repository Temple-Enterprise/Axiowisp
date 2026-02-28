import { create } from 'zustand';

export type LogSeverity = 'info' | 'warn' | 'error';

interface LogEntry {
    text: string;
    timestamp: number;
    severity: LogSeverity;
}

interface OutputState {
    logs: LogEntry[];
    appendOutput: (text: string) => void;
    clearOutput: () => void;
}

function parseSeverity(text: string): LogSeverity {
    if (text.startsWith('[error]')) return 'error';
    if (text.startsWith('[warn]')) return 'warn';
    return 'info';
}

export const useOutputStore = create<OutputState>((set) => ({
    logs: [],
    appendOutput: (text: string) =>
        set((state) => ({
            logs: [
                ...state.logs,
                { text, timestamp: Date.now(), severity: parseSeverity(text) },
            ],
        })),
    clearOutput: () => set({ logs: [] }),
}));
