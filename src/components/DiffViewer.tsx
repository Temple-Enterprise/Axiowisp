import React from 'react';
import { DiffEditor, loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useTabsStore } from '../stores/tabs-store';
import { useSettingsStore } from '../stores/settings-store';
import './DiffViewer.css';

loader.config({ monaco });

export const DiffViewer: React.FC = () => {
    const tabs = useTabsStore((s) => s.tabs);
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const theme = useSettingsStore((s) => s.theme);
    const editorFontSize = useSettingsStore((s) => s.editorFontSize);

    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) return null;

    const language = activeTab.language.startsWith('diff:')
        ? activeTab.language.slice(5)
        : 'plaintext';

    const original = activeTab.originalContent ?? '';
    const modified = activeTab.content;

    return (
        <div className="diff-viewer">
            <div className="diff-viewer__legend">
                <span className="diff-viewer__legend-item diff-viewer__legend-item--removed">Removed</span>
                <span className="diff-viewer__legend-item diff-viewer__legend-item--added">Added</span>
            </div>
            <div className="diff-viewer__editor">
                <DiffEditor
                    height="100%"
                    language={language}
                    original={original}
                    modified={modified}
                    theme={theme === 'light' ? 'axiowisp-light' : 'axiowisp-dark'}
                    options={{
                        readOnly: true,
                        fontSize: editorFontSize,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
                        fontLigatures: true,
                        renderSideBySide: true,
                        scrollBeyondLastLine: false,
                        minimap: { enabled: false },
                        padding: { top: 12, bottom: 12 },
                    }}
                />
            </div>
        </div>
    );
};
