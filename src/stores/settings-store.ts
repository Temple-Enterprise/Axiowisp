import { create } from 'zustand';

export interface SettingsState {
    // Editor
    editorFontSize: number;
    wordWrap: 'off' | 'on' | 'wordWrapColumn';
    minimapEnabled: boolean;
    tabSize: number;
    // Terminal
    terminalFontSize: number;
    // API
    openaiApiKey: string;
    openaiModel: string;
    // Layout (resizable widths/heights)
    sidebarWidth: number;
    bottomPanelHeight: number;

    setEditorFontSize: (size: number) => void;
    setWordWrap: (wrap: 'off' | 'on' | 'wordWrapColumn') => void;
    setMinimapEnabled: (enabled: boolean) => void;
    setTabSize: (size: number) => void;
    setTerminalFontSize: (size: number) => void;
    setOpenaiApiKey: (key: string) => void;
    setOpenaiModel: (model: string) => void;
    setSidebarWidth: (width: number) => void;
    setBottomPanelHeight: (height: number) => void;
}

const STORAGE_KEY = 'axiowisp-settings';

function loadSettings(): Partial<SettingsState> {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return {};
}

function saveSettings(state: Partial<SettingsState>) {
    try {
        const toSave = {
            editorFontSize: state.editorFontSize,
            wordWrap: state.wordWrap,
            minimapEnabled: state.minimapEnabled,
            tabSize: state.tabSize,
            terminalFontSize: state.terminalFontSize,
            openaiApiKey: state.openaiApiKey,
            openaiModel: state.openaiModel,
            sidebarWidth: state.sidebarWidth,
            bottomPanelHeight: state.bottomPanelHeight,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch { /* ignore */ }
}

const saved = loadSettings();

export const useSettingsStore = create<SettingsState>((set) => ({
    editorFontSize: saved.editorFontSize ?? 14,
    wordWrap: (saved.wordWrap as any) ?? 'off',
    minimapEnabled: saved.minimapEnabled ?? true,
    tabSize: saved.tabSize ?? 2,
    terminalFontSize: saved.terminalFontSize ?? 13,
    openaiApiKey: saved.openaiApiKey ?? '',
    openaiModel: saved.openaiModel ?? 'gpt-4o-mini',
    sidebarWidth: saved.sidebarWidth ?? 240,
    bottomPanelHeight: saved.bottomPanelHeight ?? 220,

    setEditorFontSize: (size) => set((s) => { const n = { ...s, editorFontSize: size }; saveSettings(n); return n; }),
    setWordWrap: (wrap) => set((s) => { const n = { ...s, wordWrap: wrap }; saveSettings(n); return n; }),
    setMinimapEnabled: (enabled) => set((s) => { const n = { ...s, minimapEnabled: enabled }; saveSettings(n); return n; }),
    setTabSize: (size) => set((s) => { const n = { ...s, tabSize: size }; saveSettings(n); return n; }),
    setTerminalFontSize: (size) => set((s) => { const n = { ...s, terminalFontSize: size }; saveSettings(n); return n; }),
    setOpenaiApiKey: (key) => set((s) => { const n = { ...s, openaiApiKey: key }; saveSettings(n); return n; }),
    setOpenaiModel: (model) => set((s) => { const n = { ...s, openaiModel: model }; saveSettings(n); return n; }),
    setSidebarWidth: (width) => set((s) => { const n = { ...s, sidebarWidth: width }; saveSettings(n); return n; }),
    setBottomPanelHeight: (height) => set((s) => { const n = { ...s, bottomPanelHeight: height }; saveSettings(n); return n; }),
}));
