import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { FileTree } from './FileTree';
import { RunPanel } from './RunPanel';
import { useWorkspaceStore } from '../stores/workspace-store';
import { useTabsStore } from '../stores/tabs-store';
import { useUiStore } from '../stores/ui-store';
import { FolderOpen, Search, ChevronDown, File, FilePlus, FolderPlus, RefreshCw, ChevronsDownUp } from 'lucide-react';
import { FileEntry } from '../../shared/types';
import './Sidebar.css';

/** Flatten file tree into a searchable list. */
function flattenTree(entries: FileEntry[], results: FileEntry[] = []): FileEntry[] {
    for (const entry of entries) {
        if (!entry.isDirectory) results.push(entry);
        if (entry.children) flattenTree(entry.children, results);
    }
    return results;
}

export const Sidebar: React.FC = () => {
    const { rootPath, fileTree, openFolder, refreshTree } = useWorkspaceStore();
    const openTab = useTabsStore((s) => s.openTab);
    const activeActivity = useUiStore((s) => s.activeActivity);
    const [searchQuery, setSearchQuery] = useState('');
    const [creatingRoot, setCreatingRoot] = useState<'file' | 'folder' | null>(null);
    const [createRootValue, setCreateRootValue] = useState('');
    const [treeCtx, setTreeCtx] = useState<{ x: number; y: number } | null>(null);
    const treeCtxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!treeCtx) return;
        const handler = (e: MouseEvent) => {
            if (treeCtxRef.current && !treeCtxRef.current.contains(e.target as Node)) {
                setTreeCtx(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [treeCtx]);

    const folderName = rootPath?.split(/[\\/]/).pop() ?? '';

    // Fuzzy file search
    const searchResults = useMemo(() => {
        if (!searchQuery.trim() || !fileTree.length) return [];
        const q = searchQuery.toLowerCase();
        const flat = flattenTree(fileTree);
        return flat
            .filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q))
            .slice(0, 50); // limit results
    }, [searchQuery, fileTree]);

    const handleSearchSelect = useCallback(
        (filePath: string) => {
            openTab(filePath);
            setSearchQuery('');
        },
        [openTab],
    );

    const handleRootCreate = useCallback(async () => {
        if (!createRootValue.trim() || !rootPath) {
            setCreatingRoot(null);
            setCreateRootValue('');
            return;
        }
        const sep = rootPath.includes('/') ? '/' : '\\';
        const newPath = rootPath + sep + createRootValue;
        if (creatingRoot === 'file') {
            await window.electronAPI.createFile(newPath);
        } else {
            await window.electronAPI.createFolder(newPath);
        }
        await refreshTree();
        setCreatingRoot(null);
        setCreateRootValue('');
    }, [createRootValue, creatingRoot, rootPath, refreshTree]);

    return (
        <div className="sidebar">
            {activeActivity === 'explorer' && (
                <>
                    <div className="sidebar__section-header">
                        <span className="sidebar__section-title">EXPLORER</span>
                        {rootPath && (
                            <div className="sidebar__toolbar">
                                <button
                                    className="sidebar__toolbar-btn"
                                    title="New File"
                                    onClick={() => setCreatingRoot('file')}
                                >
                                    <FilePlus size={14} />
                                </button>
                                <button
                                    className="sidebar__toolbar-btn"
                                    title="New Folder"
                                    onClick={() => setCreatingRoot('folder')}
                                >
                                    <FolderPlus size={14} />
                                </button>
                                <button
                                    className="sidebar__toolbar-btn"
                                    title="Refresh"
                                    onClick={refreshTree}
                                >
                                    <RefreshCw size={14} />
                                </button>
                                <button
                                    className="sidebar__toolbar-btn"
                                    title="Collapse All"
                                    onClick={refreshTree}
                                >
                                    <ChevronsDownUp size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                    {rootPath ? (
                        <>
                            <div className="sidebar__folder-header">
                                <ChevronDown size={14} />
                                <span className="sidebar__folder-name" title={rootPath}>
                                    {folderName}
                                </span>
                            </div>
                            {/* Root-level Create Input */}
                            {creatingRoot && (
                                <div className="sidebar__create-root">
                                    <input
                                        className="sidebar__create-input"
                                        placeholder={creatingRoot === 'file' ? 'filename...' : 'folder name...'}
                                        value={createRootValue}
                                        onChange={(e) => setCreateRootValue(e.target.value)}
                                        onBlur={handleRootCreate}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleRootCreate();
                                            if (e.key === 'Escape') { setCreatingRoot(null); setCreateRootValue(''); }
                                        }}
                                        autoFocus
                                    />
                                </div>
                            )}
                            <div
                                className="sidebar__tree"
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setTreeCtx({ x: e.clientX, y: e.clientY });
                                }}
                            >
                                <FileTree entries={fileTree} depth={0} />
                            </div>
                            {treeCtx && (
                                <div
                                    ref={treeCtxRef}
                                    className="file-tree__context-menu"
                                    style={{ left: treeCtx.x, top: treeCtx.y }}
                                >
                                    <button
                                        className="file-tree__context-item"
                                        onClick={() => { setTreeCtx(null); setCreatingRoot('file'); }}
                                    >
                                        <FilePlus size={13} /> New File
                                    </button>
                                    <button
                                        className="file-tree__context-item"
                                        onClick={() => { setTreeCtx(null); setCreatingRoot('folder'); }}
                                    >
                                        <FolderPlus size={13} /> New Folder
                                    </button>
                                </div>
                            )}
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
                                placeholder="Search files by name…"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        {searchQuery && searchResults.length > 0 ? (
                            <div className="sidebar__search-results">
                                {searchResults.map((file) => (
                                    <div
                                        key={file.path}
                                        className="sidebar__search-result"
                                        onClick={() => handleSearchSelect(file.path)}
                                    >
                                        <File size={13} className="sidebar__search-result-icon" />
                                        <div className="sidebar__search-result-info">
                                            <span className="sidebar__search-result-name">{file.name}</span>
                                            <span className="sidebar__search-result-path">
                                                {file.path.replace(rootPath || '', '').replace(/\\/g, '/').replace(/^\//, '')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : searchQuery && searchResults.length === 0 ? (
                            <p className="sidebar__hint" style={{ padding: '16px' }}>
                                No files found matching "{searchQuery}"
                            </p>
                        ) : (
                            <p className="sidebar__hint" style={{ padding: '16px' }}>
                                Type to search files in your project.
                                <br />Use <kbd>Ctrl+F</kbd> to find in the current file.
                            </p>
                        )}
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
