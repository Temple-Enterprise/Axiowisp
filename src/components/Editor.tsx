import React, { useRef, useCallback, useEffect } from 'react';
import MonacoEditor, { OnMount, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useTabsStore } from '../stores/tabs-store';
import { useSettingsStore } from '../stores/settings-store';
import { useEditorStore } from '../stores/editor-store';
import { registerGhostTextProvider } from '../utils/ghost-text';
import { Layout } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import 'github-markdown-css/github-markdown.css';
import './Editor.css';

loader.config({ monaco });

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
    const [showPreview, setShowPreview] = React.useState(false);
    const [splitRatio, setSplitRatio] = React.useState(50);
    const [isDragging, setIsDragging] = React.useState(false);
    const isDraggingRef = useRef(false);

    const activeTab = tabs.find((t) => t.id === activeTabId);

    useEffect(() => {
        setShowPreview(false);
        setSplitRatio(50);
    }, [activeTabId]);

    useEffect(() => {
        if (!activeTab || !editorRef.current) return;
        const model = editorRef.current.getModel();
        if (!model) return;

        const currentModelValue = model.getValue();
        if (activeTab.content !== currentModelValue && activeTab.content !== lastContentRef.current) {
            lastContentRef.current = activeTab.content;
            model.setValue(activeTab.content);
        }
    }, [activeTab?.content]);

    const handleEditorDidMount: OnMount = useCallback((editor, monacoInstance) => {
        editorRef.current = editor;
        (window as any).__axiowisp_editor = editor;
        if (activeTab) lastContentRef.current = activeTab.content;
        monacoInstance.editor.defineTheme('axiowisp-dark', AXIOWISP_THEME);
        monacoInstance.editor.defineTheme('axiowisp-light', AXIOWISP_LIGHT_THEME);
        monacoInstance.editor.setTheme(theme === 'light' ? 'axiowisp-light' : 'axiowisp-dark');
        editor.focus();

        registerGhostTextProvider(monacoInstance, editor);

        editor.onDidChangeCursorPosition((e: any) => {
            setCursorPosition(e.position.lineNumber, e.position.column);
        });

        editor.onDidChangeCursorSelection((e: any) => {
            const sel = e.selection;
            const model = editor.getModel();
            if (model && sel) {
                const selectedText = model.getValueInRange(sel);
                const lines = sel.endLineNumber - sel.startLineNumber;
                setSelection(lines, selectedText.length);
            }
        });

        const model = editor.getModel();
        if (model) {
            const eolSeq = model.getEOL();
            setEol(eolSeq === '\r\n' ? 'CRLF' : 'LF');
            model.onDidChangeContent(() => {
                const newEol = model.getEOL();
                setEol(newEol === '\r\n' ? 'CRLF' : 'LF');
            });
        }

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

    const autoSave = useSettingsStore((s) => s.autoSave);
    const autoSaveDelay = useSettingsStore((s) => s.autoSaveDelay);
    const saveActiveTab = useTabsStore((s) => s.saveActiveTab);

    useEffect(() => {
        if (!autoSave || !activeTab?.isDirty) return;
        const timer = setTimeout(() => {
            saveActiveTab();
        }, autoSaveDelay);
        return () => clearTimeout(timer);
    }, [autoSave, autoSaveDelay, activeTab?.isDirty, activeTab?.content]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        isDraggingRef.current = true;
        setIsDragging(true);
        document.body.style.cursor = 'col-resize';
        e.preventDefault();
    }, []);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;
            // Calculate percentage based on mouse X position relative to window width
            // Assuming editor takes up mostly full width minus sidebar (~300px)
            // But a simple window.innerWidth calculation is generally sufficient for a rough resizer
            const sidebarWidth = document.querySelector('.sidebar')?.clientWidth || 300;
            const availableWidth = window.innerWidth - sidebarWidth;
            const newRatio = ((e.clientX - sidebarWidth) / availableWidth) * 100;

            // Clamp between 20% and 80%
            if (newRatio >= 20 && newRatio <= 80) {
                setSplitRatio(newRatio);
            }
        };

        const handleMouseUp = () => {
            isDraggingRef.current = false;
            setIsDragging(false);
            document.body.style.cursor = 'default';
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    if (!activeTab) return null;

    if (activeTab.language === 'image') {
        // Fix: electron local file protocol needs double slashes axiowisp://local/
        const src = `axiowisp://local/${encodeURIComponent(activeTab.filePath.replace(/\\/g, '/'))}`;
        return (
            <div className="editor-media-container">
                <img src={src} alt={activeTab.fileName} className="editor-media-image" />
            </div>
        );
    }

    if (activeTab.language === 'video') {
        const src = `axiowisp://local/${encodeURIComponent(activeTab.filePath.replace(/\\/g, '/'))}`;
        return (
            <div className="editor-media-container">
                <video controls src={src} className="editor-media-video" />
            </div>
        );
    }

    return (
        <div className="editor">
            {activeTab.language === 'markdown' && (
                <div className="editor__toolbar">
                    <button
                        className={`editor__preview-btn ${showPreview ? 'editor__preview-btn--active' : ''}`}
                        onClick={() => setShowPreview(!showPreview)}
                        title="Toggle Markdown Preview"
                    >
                        <Layout size={14} />
                        <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
                    </button>
                </div>
            )}

            <div className={`editor__content ${showPreview ? 'editor__content--split' : ''}`}>
                <div className="editor__monaco-container" style={{ width: showPreview ? `${splitRatio}%` : '100%', flex: 'none', pointerEvents: isDragging ? 'none' : 'auto' }}>
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

                {showPreview && activeTab.language === 'markdown' && (
                    <>
                        <div className={`editor__resizer ${isDragging ? 'editor__resizer--dragging' : ''}`} onMouseDown={handleMouseDown} />
                        <div
                            className={`editor__preview-wrapper markdown-body ${theme === 'light' ? 'markdown-body-light' : 'markdown-body-dark'}`}
                            style={{ width: `${100 - splitRatio}%`, flex: 'none', pointerEvents: isDragging ? 'none' : 'auto' }}
                        >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {activeTab.content}
                            </ReactMarkdown>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
