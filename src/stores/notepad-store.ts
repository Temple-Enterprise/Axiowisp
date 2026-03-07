import { create } from 'zustand';

const STORAGE_KEY = 'axiowisp-notepad';

interface NotepadState {
    content: string;
    setContent: (text: string) => void;
}

function loadContent(): string {
    try {
        return localStorage.getItem(STORAGE_KEY) ?? '';
    } catch {
        return '';
    }
}

export const useNotepadStore = create<NotepadState>((set) => ({
    content: loadContent(),
    setContent: (text) => {
        try { localStorage.setItem(STORAGE_KEY, text); } catch { }
        set({ content: text });
    },
}));
