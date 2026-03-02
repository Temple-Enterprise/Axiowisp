import { create } from 'zustand';

export interface Snippet {
    id: string;
    name: string;
    language: string;
    code: string;
    createdAt: number;
}

const STORAGE_KEY = 'axiowisp-snippets';

function load(): Snippet[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { }
    return [];
}

function save(snippets: Snippet[]) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets)); } catch { }
}

interface SnippetsState {
    snippets: Snippet[];
    addSnippet: (name: string, language: string, code: string) => void;
    removeSnippet: (id: string) => void;
    updateSnippet: (id: string, updates: Partial<Pick<Snippet, 'name' | 'code' | 'language'>>) => void;
}

export const useSnippetsStore = create<SnippetsState>((set) => ({
    snippets: load(),

    addSnippet: (name, language, code) => set((s) => {
        const next = [
            ...s.snippets,
            { id: crypto.randomUUID(), name, language, code, createdAt: Date.now() },
        ];
        save(next);
        return { snippets: next };
    }),

    removeSnippet: (id) => set((s) => {
        const next = s.snippets.filter((sn) => sn.id !== id);
        save(next);
        return { snippets: next };
    }),

    updateSnippet: (id, updates) => set((s) => {
        const next = s.snippets.map((sn) => sn.id === id ? { ...sn, ...updates } : sn);
        save(next);
        return { snippets: next };
    }),
}));
