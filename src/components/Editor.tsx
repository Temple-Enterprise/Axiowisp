import React, { useRef, useCallback } from 'react';
import MonacoEditor, { OnMount, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useTabsStore } from '../stores/tabs-store';
import { useSettingsStore } from '../stores/settings-store';
import './Editor.css';

// Tell @monaco-editor/react to use our local monaco-editor instead of CDN
loader.config({ monaco });

// Custom dark theme matching Axiowisp tokens
const AXIOWISP_THEME: monaco.editor.IStandaloneThemeData = {
    base: 'vs-dark',
    inherit: true,
    rules: [
        { token: '', foreground: 'e6edf3', background: '0d1117' },
        { token: 'comment', foreground: '6e7681', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657' },
        { token: 'function', foreground: 'd2a8ff' },
        { token: 'variable', foreground: 'ffa657' },
        { token: 'constant', foreground: '79c0ff' },
        { token: 'operator', foreground: 'ff7b72' },
        { token: 'delimiter', foreground: '8b949e' },
    ],
    colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e6edf3',
        'editor.lineHighlightBackground': '#161b22',
        'editor.selectionBackground': '#264f78',
        'editorCursor.foreground': '#58a6ff',
        'editorLineNumber.foreground': '#6e7681',
        'editorLineNumber.activeForeground': '#e6edf3',
        'editor.inactiveSelectionBackground': '#1c2333',
        'editorIndentGuide.background': '#21262d',
        'editorIndentGuide.activeBackground': '#30363d',
        'editorWidget.background': '#161b22',
        'editorWidget.border': '#30363d',
        'editorSuggestWidget.background': '#161b22',
        'editorSuggestWidget.border': '#30363d',
        'editorSuggestWidget.selectedBackground': '#263045',
        'editorHoverWidget.background': '#161b22',
        'editorHoverWidget.border': '#30363d',
        'scrollbarSlider.background': '#6e768133',
        'scrollbarSlider.hoverBackground': '#6e768155',
        'scrollbarSlider.activeBackground': '#6e768177',
        'minimap.background': '#0d1117',
    },
};

export const Editor: React.FC = () => {
    const tabs = useTabsStore((s) => s.tabs);
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const updateContent = useTabsStore((s) => s.updateContent);
    const editorFontSize = useSettingsStore((s) => s.editorFontSize);
    const wordWrap = useSettingsStore((s) => s.wordWrap);
    const minimapEnabled = useSettingsStore((s) => s.minimapEnabled);
    const tabSize = useSettingsStore((s) => s.tabSize);
    const editorRef = useRef<any>(null);

    const activeTab = tabs.find((t) => t.id === activeTabId);

    const handleEditorDidMount: OnMount = useCallback((editor, monacoInstance) => {
        editorRef.current = editor;
        monacoInstance.editor.defineTheme('axiowisp', AXIOWISP_THEME);
        monacoInstance.editor.setTheme('axiowisp');
        editor.focus();
    }, []);

    const handleChange = useCallback(
        (value: string | undefined) => {
            if (activeTabId && value !== undefined) {
                updateContent(activeTabId, value);
            }
        },
        [activeTabId, updateContent],
    );

    if (!activeTab) return null;

    return (
        <div className="editor">
            <MonacoEditor
                key={activeTab.id}
                height="100%"
                language={activeTab.language}
                value={activeTab.content}
                onChange={handleChange}
                onMount={handleEditorDidMount}
                theme="axiowisp"
                loading={<div className="editor__loading">Loading editor…</div>}
                options={{
                    fontSize: editorFontSize,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                    fontLigatures: true,
                    lineHeight: Math.round(editorFontSize * 1.6),
                    letterSpacing: 0.3,
                    minimap: { enabled: minimapEnabled, maxColumn: 80 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    padding: { top: 12, bottom: 12 },
                    renderLineHighlight: 'gutter',
                    wordWrap: wordWrap,
                    tabSize: tabSize,
                    automaticLayout: true,
                    bracketPairColorization: { enabled: true },
                    guides: {
                        bracketPairs: true,
                        indentation: true,
                    },
                    suggest: {
                        showIcons: true,
                    },
                }}
            />
        </div>
    );
};
