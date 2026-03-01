import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { FileTree } from './FileTree';
import { RunPanel } from './RunPanel';
import { GitPanel } from './GitPanel';
import { useWorkspaceStore } from '../stores/workspace-store';
import { useTabsStore } from '../stores/tabs-store';
import { useUiStore } from '../stores/ui-store';
import { useNotificationStore } from '../stores/notification-store';
import { FolderOpen, Search, ChevronDown, File, FilePlus, FolderPlus, RefreshCw, ChevronsDownUp, Replace } from 'lucide-react';
import { FileEntry, SearchMatch } from '../../shared/types';
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
    const addNotification = useNotificationStore((s) => s.addNotification);
    const [searchQuery, setSearchQuery] = useState('');
    const [replaceQuery, setReplaceQuery] = useState('');
    const [showReplace, setShowReplace] = useState(false);
    const [contentSearchResults, setContentSearchResults] = useState<SearchMatch[]>([]);
    const [isSearching, setIsSearching] = useState(false);
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

    // Fuzzy file name search
    const fileNameResults = useMemo(() => {
        if (!searchQuery.trim() || !fileTree.length) return [];
        const q = searchQuery.toLowerCase();
        const flat = flattenTree(fileTree);
        return flat
            .filter((f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q))
            .slice(0, 50);
    }, [searchQuery, fileTree]);

    const handleSearchSelect = useCallback(
        (filePath: string) => { openTab(filePath); },
        [openTab],
    );

    // Content search — searches inside files
    const handleContentSearch = useCallback(async () => {
        if (!searchQuery.trim() || !rootPath) return;
        setIsSearching(true);
        try {
            const result = await window.electronAPI.searchInFiles(rootPath, searchQuery, false);
            if (result.success && result.data) {
                setContentSearchResults(result.data as SearchMatch[]);
            }
        } catch { /* ignore */ }
        setIsSearching(false);
    }, [searchQuery, rootPath]);

    const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleContentSearch();
    }, [handleContentSearch]);

    const handleReplaceInFile = useCallback(async (filePath: string) => {
        const result = await window.electronAPI.replaceInFile(filePath, searchQuery, replaceQuery, false);
        if (result.success) {
            addNotification(`Replaced ${result.data} occurrence(s) in ${filePath.split(/[\\/]/).pop()}`, 'success');
            handleContentSearch();
        }
    }, [searchQuery, replaceQuery, handleContentSearch, addNotification]);

    const handleReplaceAll = useCallback(async () => {
        const uniqueFiles = [...new Set(contentSearchResults.map((r) => r.filePath))];
        for (const fp of uniqueFiles) {
            await window.electronAPI.replaceInFile(fp, searchQuery, replaceQuery, false);
        }
        addNotification(`Replaced in ${uniqueFiles.length} file(s)`, 'success');
        handleContentSearch();
    }, [contentSearchResults, searchQuery, replaceQuery, handleContentSearch, addNotification]);

    // Group content search results by file
    const groupedResults = useMemo(() => {
        const map = new Map<string, SearchMatch[]>();
        for (const r of contentSearchResults) {
            if (!map.has(r.filePath)) map.set(r.filePath, []);
            map.get(r.filePath)!.push(r);
        }
        return map;
    }, [contentSearchResults]);

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
                                <button className="sidebar__toolbar-btn" title="New File" onClick={() => setCreatingRoot('file')}>
                                    <FilePlus size={14} />
                                </button>
                                <button className="sidebar__toolbar-btn" title="New Folder" onClick={() => setCreatingRoot('folder')}>
                                    <FolderPlus size={14} />
                                </button>
                                <button className="sidebar__toolbar-btn" title="Refresh" onClick={refreshTree}>
                                    <RefreshCw size={14} />
                                </button>
                                <button className="sidebar__toolbar-btn" title="Collapse All" onClick={refreshTree}>
                                    <ChevronsDownUp size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                    {rootPath ? (
                        <>
                            <div className="sidebar__folder-header">
                                <ChevronDown size={14} />
                                <span className="sidebar__folder-name" title={rootPath}>{folderName}</span>
                            </div>
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
                                    <button className="file-tree__context-item" onClick={() => { setTreeCtx(null); setCreatingRoot('file'); }}>
                                        <FilePlus size={13} /> New File
                                    </button>
                                    <button className="file-tree__context-item" onClick={() => { setTreeCtx(null); setCreatingRoot('folder'); }}>
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
                            <p className="sidebar__hint">Open a project folder to get started</p>
                        </div>
                    )}
                </>
            )}

            {activeActivity === 'search' && (
                <>
                    <div className="sidebar__section-header">
                        <span className="sidebar__section-title">SEARCH</span>
                        <div className="sidebar__toolbar">
                            <button
                                className={`sidebar__toolbar-btn ${showReplace ? 'sidebar__toolbar-btn--active' : ''}`}
                                title="Toggle Replace"
                                onClick={() => setShowReplace(!showReplace)}
                            >
                                <Replace size={14} />
                            </button>
                        </div>
                    </div>
                    <div className="sidebar__search-content">
                        <div className="sidebar__search-input-wrap">
                            <Search size={14} className="sidebar__search-icon" />
                            <input
                                className="sidebar__search-input"
                                placeholder="Search in files…"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                autoFocus
                            />
                        </div>
                        {showReplace && (
                            <div className="sidebar__search-input-wrap sidebar__replace-wrap">
                                <Replace size={14} className="sidebar__search-icon" />
                                <input
                                    className="sidebar__search-input"
                                    placeholder="Replace…"
                                    type="text"
                                    value={replaceQuery}
                                    onChange={(e) => setReplaceQuery(e.target.value)}
                                />
                                <button
                                    className="sidebar__replace-all-btn"
                                    onClick={handleReplaceAll}
                                    title="Replace All"
                                    disabled={contentSearchResults.length === 0}
                                >
                                    All
                                </button>
                            </div>
                        )}

                        {isSearching && (
                            <p className="sidebar__hint" style={{ padding: '16px' }}>Searching…</p>
                        )}

                        {contentSearchResults.length > 0 ? (
                            <div className="sidebar__search-results">
                                <div className="sidebar__search-summary">
                                    {contentSearchResults.length} results in {groupedResults.size} files
                                </div>
                                {[...groupedResults.entries()].map(([filePath, matches]) => (
                                    <div key={filePath} className="sidebar__search-file-group">
                                        <div className="sidebar__search-file-header">
                                            <File size={13} />
                                            <span className="sidebar__search-file-name">{filePath.split(/[\\/]/).pop()}</span>
                                            <span className="sidebar__search-file-count">{matches.length}</span>
                                            {showReplace && (
                                                <button
                                                    className="sidebar__search-replace-btn"
                                                    onClick={() => handleReplaceInFile(filePath)}
                                                    title="Replace in file"
                                                >
                                                    <Replace size={11} />
                                                </button>
                                            )}
                                        </div>
                                        {matches.slice(0, 10).map((m, idx) => (
                                            <div
                                                key={idx}
                                                className="sidebar__search-result"
                                                onClick={() => handleSearchSelect(filePath)}
                                            >
                                                <span className="sidebar__search-line-num">{m.lineNumber}</span>
                                                <span className="sidebar__search-line-content">
                                                    {m.lineContent.substring(0, 100)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        ) : !isSearching && searchQuery && fileNameResults.length > 0 ? (
                            <div className="sidebar__search-results">
                                <div className="sidebar__search-summary">Files matching "{searchQuery}"</div>
                                {fileNameResults.map((file) => (
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
                        ) : !isSearching && searchQuery ? (
                            <p className="sidebar__hint" style={{ padding: '16px' }}>
                                No results found. Press Enter to search file contents.
                            </p>
                        ) : (
                            <p className="sidebar__hint" style={{ padding: '16px' }}>
                                Type to search files in your project.
                                <br />Press <kbd>Enter</kbd> to search inside file contents.
                            </p>
                        )}
                    </div>
                </>
            )}

            {activeActivity === 'git' && (
                <>
                    <div className="sidebar__section-header">
                        <span className="sidebar__section-title">SOURCE CONTROL</span>
                    </div>
                    <GitPanel />
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
