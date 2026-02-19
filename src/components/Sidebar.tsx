import React from 'react';
import { FileTree } from './FileTree';
import { RunPanel } from './RunPanel';
import { useWorkspaceStore } from '../stores/workspace-store';
import { useUiStore } from '../stores/ui-store';
import { FolderOpen, Search, ChevronDown } from 'lucide-react';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
    const { rootPath, fileTree, openFolder } = useWorkspaceStore();
    const activeActivity = useUiStore((s) => s.activeActivity);

    const folderName = rootPath?.split(/[\\/]/).pop() ?? '';

    return (
        <div className="sidebar">
            {activeActivity === 'explorer' && (
                <>
                    <div className="sidebar__section-header">
                        <span className="sidebar__section-title">EXPLORER</span>
                    </div>
                    {rootPath ? (
                        <>
                            <div className="sidebar__folder-header">
                                <ChevronDown size={14} />
                                <span className="sidebar__folder-name" title={rootPath}>
                                    {folderName}
                                </span>
                            </div>
                            <div className="sidebar__tree">
                                <FileTree entries={fileTree} depth={0} />
                            </div>
                        </>
                    ) : (
                        <div className="sidebar__empty">
                            <button className="sidebar__open-btn" onClick={openFolder}>
                                <FolderOpen size={18} />
                                Open Folder
                            </button>
                            <p className="sidebar__hint">
                                Open a project folder to get started
                            </p>
                        </div>
                    )}
                </>
            )}

            {activeActivity === 'search' && (
                <>
                    <div className="sidebar__section-header">
                        <span className="sidebar__section-title">SEARCH</span>
                    </div>
                    <div className="sidebar__search-content">
                        <div className="sidebar__search-input-wrap">
                            <Search size={14} className="sidebar__search-icon" />
                            <input
                                className="sidebar__search-input"
                                placeholder="Search files…"
                                type="text"
                            />
                        </div>
                        <p className="sidebar__hint" style={{ padding: '16px' }}>
                            Full-text search coming soon.
                            <br />Use <kbd>Ctrl+F</kbd> to find in the current file.
                        </p>
                    </div>
                </>
            )}

            {activeActivity === 'run' && (
                <>
                    <div className="sidebar__section-header">
                        <span className="sidebar__section-title">RUN & DEBUG</span>
                    </div>
                    <RunPanel />
                </>
            )}
        </div>
    );
};
