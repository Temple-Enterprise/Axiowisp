import React from 'react';
import { useTabsStore } from '../stores/tabs-store';
import { useWorkspaceStore } from '../stores/workspace-store';
import { useEditorStore } from '../stores/editor-store';
import { useOutputStore } from '../stores/output-store';
import { useSettingsStore } from '../stores/settings-store';
import { AlertTriangle, AlertCircle, GitBranch } from 'lucide-react';
import './StatusBar.css';

export const StatusBar: React.FC = () => {
    const tabs = useTabsStore((s) => s.tabs);
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const rootPath = useWorkspaceStore((s) => s.rootPath);
    const cursorLine = useEditorStore((s) => s.cursorLine);
    const cursorColumn = useEditorStore((s) => s.cursorColumn);
    const selectedChars = useEditorStore((s) => s.selectedChars);
    const eol = useEditorStore((s) => s.eol);
    const logs = useOutputStore((s) => s.logs);
    const tabSize = useSettingsStore((s) => s.tabSize);

    const activeTab = tabs.find((t) => t.id === activeTabId);
    const errorCount = logs.filter((l) => l.severity === 'error').length;
    const warnCount = logs.filter((l) => l.severity === 'warn').length;

    return (
        <div className="statusbar">
            <div className="statusbar__left">
                {rootPath && (
                    <span className="statusbar__item statusbar__branch" title={rootPath}>
                        <GitBranch size={12} />
                        {rootPath.split(/[\\/]/).pop()}
                    </span>
                )}
                <span className="statusbar__item statusbar__errors">
                    <AlertCircle size={12} />
                    <span>{errorCount}</span>
                    <AlertTriangle size={12} />
                    <span>{warnCount}</span>
                </span>
            </div>
            <div className="statusbar__center">
                <span className="statusbar__item statusbar__branding">
                    Built by{' '}
                    <a href="https://templeenterprise.com" target="_blank" rel="noopener noreferrer" className="statusbar__link">
                        Temple Enterprise LLC
                    </a>
                </span>
            </div>
            <div className="statusbar__right">
                {activeTab && (
                    <>
                        <span className="statusbar__item statusbar__cursor">
                            Ln {cursorLine}, Col {cursorColumn}
                            {selectedChars > 0 && ` (${selectedChars} selected)`}
                        </span>
                        <span className="statusbar__item">Spaces: {tabSize}</span>
                        <span className="statusbar__item">{eol}</span>
                        <span className="statusbar__item">UTF-8</span>
                        <span className="statusbar__item statusbar__language">{activeTab.language}</span>
                    </>
                )}
                <span className="statusbar__item statusbar__version">Axiowisp v0.3.2</span>
            </div>
        </div>
    );
};
