import React from 'react';
import { useTabsStore } from '../stores/tabs-store';
import { useWorkspaceStore } from '../stores/workspace-store';
import './StatusBar.css';

export const StatusBar: React.FC = () => {
    const tabs = useTabsStore((s) => s.tabs);
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const rootPath = useWorkspaceStore((s) => s.rootPath);

    const activeTab = tabs.find((t) => t.id === activeTabId);

    return (
        <div className="statusbar">
            <div className="statusbar__left">
                {rootPath && (
                    <span className="statusbar__item statusbar__branch" title={rootPath}>
                        {rootPath.split(/[\\/]/).pop()}
                    </span>
                )}
            </div>
            <div className="statusbar__right">
                {activeTab && (
                    <>
                        <span className="statusbar__item">{activeTab.language}</span>
                        <span className="statusbar__item">UTF-8</span>
                    </>
                )}
                <span className="statusbar__item statusbar__version">Axiowisp v0.1</span>
            </div>
        </div>
    );
};
