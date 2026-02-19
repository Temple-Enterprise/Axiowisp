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
    activeProvider: 'openai' | 'anthropic' | 'gemini';
    openaiApiKey: string;
    openaiModel: string;
    anthropicApiKey: string;
    anthropicModel: string;
    geminiApiKey: string;
    geminiModel: string;
    // Layout (resizable widths/heights)
    sidebarWidth: number;
    bottomPanelHeight: number;
    chatPanelWidth: number;

    setEditorFontSize: (size: number) => void;
    setWordWrap: (wrap: 'off' | 'on' | 'wordWrapColumn') => void;
    setMinimapEnabled: (enabled: boolean) => void;
    setTabSize: (size: number) => void;
    setTerminalFontSize: (size: number) => void;
    setOpenaiApiKey: (key: string) => void;
    setOpenaiModel: (model: string) => void;
    setAnthropicApiKey: (key: string) => void;
    setAnthropicModel: (model: string) => void;
    setGeminiApiKey: (key: string) => void;
    setGeminiModel: (model: string) => void;
    setActiveProvider: (provider: 'openai' | 'anthropic' | 'gemini') => void;
    setSidebarWidth: (width: number) => void;
    setBottomPanelHeight: (height: number) => void;
    setChatPanelWidth: (width: number) => void;
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
            anthropicApiKey: state.anthropicApiKey,
            anthropicModel: state.anthropicModel,
            geminiApiKey: state.geminiApiKey,
            geminiModel: state.geminiModel,
            activeProvider: state.activeProvider,
            sidebarWidth: state.sidebarWidth,
            bottomPanelHeight: state.bottomPanelHeight,
            chatPanelWidth: state.chatPanelWidth,
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
    activeProvider: (saved.activeProvider as any) ?? 'openai',
    openaiApiKey: saved.openaiApiKey ?? '',
    openaiModel: saved.openaiModel ?? 'gpt-4o-mini',
    anthropicApiKey: saved.anthropicApiKey ?? '',
    anthropicModel: saved.anthropicModel ?? 'claude-3-5-sonnet-20241022',
    geminiApiKey: saved.geminiApiKey ?? '',
    geminiModel: saved.geminiModel ?? 'gemini-1.5-pro',
    sidebarWidth: saved.sidebarWidth ?? 240,
    bottomPanelHeight: saved.bottomPanelHeight ?? 220,
    chatPanelWidth: saved.chatPanelWidth ?? 360,

    setEditorFontSize: (size) => set((s) => { const n = { ...s, editorFontSize: size }; saveSettings(n); return n; }),
    setWordWrap: (wrap) => set((s) => { const n = { ...s, wordWrap: wrap }; saveSettings(n); return n; }),
    setMinimapEnabled: (enabled) => set((s) => { const n = { ...s, minimapEnabled: enabled }; saveSettings(n); return n; }),
    setTabSize: (size) => set((s) => { const n = { ...s, tabSize: size }; saveSettings(n); return n; }),
    setTerminalFontSize: (size) => set((s) => { const n = { ...s, terminalFontSize: size }; saveSettings(n); return n; }),
    setOpenaiApiKey: (key) => set((s) => { const n = { ...s, openaiApiKey: key }; saveSettings(n); return n; }),
    setOpenaiModel: (model) => set((s) => { const n = { ...s, openaiModel: model }; saveSettings(n); return n; }),
    setAnthropicApiKey: (key) => set((s) => { const n = { ...s, anthropicApiKey: key }; saveSettings(n); return n; }),
    setAnthropicModel: (model) => set((s) => { const n = { ...s, anthropicModel: model }; saveSettings(n); return n; }),
    setGeminiApiKey: (key) => set((s) => { const n = { ...s, geminiApiKey: key }; saveSettings(n); return n; }),
    setGeminiModel: (model) => set((s) => { const n = { ...s, geminiModel: model }; saveSettings(n); return n; }),
    setActiveProvider: (provider) => set((s) => { const n = { ...s, activeProvider: provider }; saveSettings(n); return n; }),
    setSidebarWidth: (width) => set((s) => { const n = { ...s, sidebarWidth: width }; saveSettings(n); return n; }),
    setBottomPanelHeight: (height) => set((s) => { const n = { ...s, bottomPanelHeight: height }; saveSettings(n); return n; }),
    setChatPanelWidth: (width) => set((s) => { const n = { ...s, chatPanelWidth: width }; saveSettings(n); return n; }),
}));
