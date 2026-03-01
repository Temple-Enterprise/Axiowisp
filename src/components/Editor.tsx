import React, { useRef, useCallback, useEffect } from 'react';
import MonacoEditor, { OnMount, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useTabsStore } from '../stores/tabs-store';
import { useSettingsStore } from '../stores/settings-store';
import { useEditorStore } from '../stores/editor-store';
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

const AXIOWISP_LIGHT_THEME: monaco.editor.IStandaloneThemeData = {
    base: 'vs',
    inherit: true,
    rules: [
        { token: '', foreground: '24292f', background: 'ffffff' },
        { token: 'comment', foreground: '6e7781', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'cf222e' },
        { token: 'string', foreground: '0a3069' },
        { token: 'number', foreground: '0550ae' },
        { token: 'type', foreground: '9a6700' },
        { token: 'function', foreground: '8250df' },
        { token: 'variable', foreground: '9a6700' },
        { token: 'constant', foreground: '0550ae' },
        { token: 'operator', foreground: 'cf222e' },
        { token: 'delimiter', foreground: '57606a' },
    ],
    colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#24292f',
        'editor.lineHighlightBackground': '#f6f8fa',
        'editor.selectionBackground': '#b3d4ff',
        'editorCursor.foreground': '#0969da',
        'editorLineNumber.foreground': '#8c959f',
        'editorLineNumber.activeForeground': '#24292f',
        'editor.inactiveSelectionBackground': '#e1e4e8',
        'editorIndentGuide.background': '#eaecef',
        'editorIndentGuide.activeBackground': '#d0d7de',
        'editorWidget.background': '#f6f8fa',
        'editorWidget.border': '#d0d7de',
        'editorSuggestWidget.background': '#f6f8fa',
        'editorSuggestWidget.border': '#d0d7de',
        'editorSuggestWidget.selectedBackground': '#eaecef',
        'editorHoverWidget.background': '#f6f8fa',
        'editorHoverWidget.border': '#d0d7de',
        'scrollbarSlider.background': '#8c959f33',
        'scrollbarSlider.hoverBackground': '#8c959f55',
        'scrollbarSlider.activeBackground': '#8c959f77',
        'minimap.background': '#ffffff',
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
    const theme = useSettingsStore((s) => s.theme);
    const setCursorPosition = useEditorStore((s) => s.setCursorPosition);
    const setSelection = useEditorStore((s) => s.setSelection);
    const setEol = useEditorStore((s) => s.setEol);
    const editorRef = useRef<any>(null);
    const lastContentRef = useRef<string>('');

    const activeTab = tabs.find((t) => t.id === activeTabId);

    // Sync external content changes (e.g. AI accept, git pull) into Monaco
    useEffect(() => {
        if (!activeTab || !editorRef.current) return;
        const model = editorRef.current.getModel();
        if (!model) return;

        const currentModelValue = model.getValue();
        // Only push if the store content differs from what Monaco has
        // (meaning it was changed externally, not by the user typing)
        if (activeTab.content !== currentModelValue && activeTab.content !== lastContentRef.current) {
            lastContentRef.current = activeTab.content;
            model.setValue(activeTab.content);
        }
    }, [activeTab?.content]);

    const handleEditorDidMount: OnMount = useCallback((editor, monacoInstance) => {
        editorRef.current = editor;
        if (activeTab) lastContentRef.current = activeTab.content;
        monacoInstance.editor.defineTheme('axiowisp-dark', AXIOWISP_THEME);
        monacoInstance.editor.defineTheme('axiowisp-light', AXIOWISP_LIGHT_THEME);
        monacoInstance.editor.setTheme(theme === 'light' ? 'axiowisp-light' : 'axiowisp-dark');
        editor.focus();

        // Track cursor position
        editor.onDidChangeCursorPosition((e: any) => {
            setCursorPosition(e.position.lineNumber, e.position.column);
        });

        // Track selection
        editor.onDidChangeCursorSelection((e: any) => {
            const sel = e.selection;
            const model = editor.getModel();
            if (model && sel) {
                const selectedText = model.getValueInRange(sel);
                const lines = sel.endLineNumber - sel.startLineNumber;
                setSelection(lines, selectedText.length);
            }
        });

        // Detect EOL
        const model = editor.getModel();
        if (model) {
            const eolSeq = model.getEOL();
            setEol(eolSeq === '\r\n' ? 'CRLF' : 'LF');
            model.onDidChangeContent(() => {
                const newEol = model.getEOL();
                setEol(newEol === '\r\n' ? 'CRLF' : 'LF');
            });
        }

        // Set initial cursor position
        const pos = editor.getPosition();
        if (pos) {
            setCursorPosition(pos.lineNumber, pos.column);
        }
    }, [theme, setCursorPosition, setSelection, setEol]);

    useEffect(() => {
        if (editorRef.current && window.monaco) {
            window.monaco.editor.setTheme(theme === 'light' ? 'axiowisp-light' : 'axiowisp-dark');
        }
    }, [theme]);

    const handleChange = useCallback(
        (value: string | undefined) => {
            if (activeTabId && value !== undefined) {
                updateContent(activeTabId, value);
            }
        },
        [activeTabId, updateContent],
    );

    if (!activeTab) return null;

    if (activeTab.language === 'image') {
        const src = `axiowisp://local/?path=${encodeURIComponent(activeTab.filePath)}`;
        return (
            <div className="editor-media-container">
                <img src={src} alt={activeTab.fileName} className="editor-media-image" />
            </div>
        );
    }

    if (activeTab.language === 'video') {
        const src = `axiowisp://local/?path=${encodeURIComponent(activeTab.filePath)}`;
        return (
            <div className="editor-media-container">
                <video controls src={src} className="editor-media-video" />
            </div>
        );
    }

    return (
        <div className="editor">
            <MonacoEditor
                key={activeTab.id}
                height="100%"
                language={activeTab.language}
                value={activeTab.content}
                onChange={handleChange}
                onMount={handleEditorDidMount}
                theme={theme === 'light' ? 'axiowisp-light' : 'axiowisp-dark'}
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
