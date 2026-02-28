import { create } from 'zustand';

interface EditorState {
    cursorLine: number;
    cursorColumn: number;
    selectedLines: number;
    selectedChars: number;
    eol: 'LF' | 'CRLF';
    setCursorPosition: (line: number, column: number) => void;
    setSelection: (lines: number, chars: number) => void;
    setEol: (eol: 'LF' | 'CRLF') => void;
}

export const useEditorStore = create<EditorState>((set) => ({
    cursorLine: 1,
    cursorColumn: 1,
    selectedLines: 0,
    selectedChars: 0,
    eol: 'LF',

    setCursorPosition: (line, column) => set({ cursorLine: line, cursorColumn: column }),
    setSelection: (lines, chars) => set({ selectedLines: lines, selectedChars: chars }),
    setEol: (eol) => set({ eol }),
}));
