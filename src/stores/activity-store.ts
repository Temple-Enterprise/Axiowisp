import { create } from 'zustand';

export type ActivityType =
    | 'file-open'
    | 'file-save'
    | 'git-commit'
    | 'git-push'
    | 'api-request'
    | 'ai-message'
    | 'ws-connect';

export interface ActivityEvent {
    id: string;
    type: ActivityType;
    label: string;
    timestamp: number;
}

const MAX_EVENTS = 100;
const STORAGE_KEY = 'axiowisp-activity';

function load(): ActivityEvent[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { }
    return [];
}

function save(events: ActivityEvent[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); } catch { }
}

interface ActivityState {
    events: ActivityEvent[];
    addEvent: (type: ActivityType, label: string) => void;
    clearEvents: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
    events: load(),

    addEvent: (type, label) => set((s) => {
        const next: ActivityEvent[] = [
            { id: crypto.randomUUID(), type, label, timestamp: Date.now() },
            ...s.events,
        ].slice(0, MAX_EVENTS);
        save(next);
        return { events: next };
    }),

    clearEvents: () => set(() => {
        save([]);
        return { events: [] };
    }),
}));
