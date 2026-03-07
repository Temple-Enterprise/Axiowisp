import { create } from 'zustand';

interface Bookmark {
    id: string;
    filePath: string;
    line: number;
    label: string;
}

interface BookmarksState {
    bookmarks: Bookmark[];
    addBookmark: (filePath: string, line: number) => void;
    removeBookmark: (id: string) => void;
    toggleBookmark: (filePath: string, line: number) => void;
    clearBookmarks: () => void;
    getBookmarksForFile: (filePath: string) => Bookmark[];
    nextBookmark: (filePath: string, currentLine: number) => Bookmark | null;
    previousBookmark: (filePath: string, currentLine: number) => Bookmark | null;
}

let bookmarkId = 0;

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
    bookmarks: [],

    addBookmark: (filePath, line) => {
        const id = `bm-${++bookmarkId}`;
        const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
        set((s) => ({
            bookmarks: [...s.bookmarks, { id, filePath, line, label: `${fileName}:${line}` }],
        }));
    },

    removeBookmark: (id) => {
        set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) }));
    },

    toggleBookmark: (filePath, line) => {
        const { bookmarks } = get();
        const existing = bookmarks.find((b) => b.filePath === filePath && b.line === line);
        if (existing) {
            set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== existing.id) }));
        } else {
            get().addBookmark(filePath, line);
        }
    },

    clearBookmarks: () => set({ bookmarks: [] }),

    getBookmarksForFile: (filePath) => {
        return get().bookmarks.filter((b) => b.filePath === filePath).sort((a, b) => a.line - b.line);
    },

    nextBookmark: (filePath, currentLine) => {
        const fileBookmarks = get().getBookmarksForFile(filePath);
        return fileBookmarks.find((b) => b.line > currentLine) ?? fileBookmarks[0] ?? null;
    },

    previousBookmark: (filePath, currentLine) => {
        const fileBookmarks = get().getBookmarksForFile(filePath);
        const reversed = [...fileBookmarks].reverse();
        return reversed.find((b) => b.line < currentLine) ?? reversed[0] ?? null;
    },
}));
