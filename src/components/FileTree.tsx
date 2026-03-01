import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileEntry } from '../../shared/types';
import { useTabsStore } from '../stores/tabs-store';
import { useWorkspaceStore } from '../stores/workspace-store';
import { getFileIcon } from '../utils/file-icons';
import { useReviewStore } from '../stores/review-store';
import { ChevronRight, ChevronDown, FilePlus, FolderPlus, Pencil, Trash2, Shield } from 'lucide-react';
import './FileTree.css';

interface FileTreeProps {
    entries: FileEntry[];
    depth: number;
}

export const FileTree: React.FC<FileTreeProps> = ({ entries, depth }) => {
    return (
        <ul className="file-tree" role="tree">
            {entries.map((entry) => (
                <FileTreeItem key={entry.path} entry={entry} depth={depth} />
            ))}
        </ul>
    );
};

interface ContextMenuState {
    x: number;
    y: number;
    entry: FileEntry;
}

interface FileTreeItemProps {
    entry: FileEntry;
    depth: number;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ entry, depth }) => {
    const [expanded, setExpanded] = useState(false);
    const openTab = useTabsStore((s) => s.openTab);
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const renameTab = useTabsStore((s) => s.renameTab);
    const refreshTree = useWorkspaceStore((s) => s.refreshTree);
    const reviewFile = useReviewStore((s) => s.reviewFile);
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const [creating, setCreating] = useState<'file' | 'folder' | null>(null);
    const [createValue, setCreateValue] = useState('');
    const menuRef = useRef<HTMLDivElement>(null);
    const renameRef = useRef<HTMLInputElement>(null);
    const createRef = useRef<HTMLInputElement>(null);

    const isActive = !entry.isDirectory && entry.path === activeTabId;
    const iconInfo = getFileIcon(entry.name, entry.isDirectory, expanded);
    const IconComponent = iconInfo.icon;

    const handleClick = () => {
        if (entry.isDirectory) {
            setExpanded(!expanded);
        } else {
            openTab(entry.path);
        }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, entry });
    };

    useEffect(() => {
        if (!contextMenu) return;
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [contextMenu]);

    useEffect(() => {
        if (renaming && renameRef.current) {
            renameRef.current.focus();
            const dotIdx = renameValue.lastIndexOf('.');
            renameRef.current.setSelectionRange(0, dotIdx > 0 ? dotIdx : renameValue.length);
        }
    }, [renaming, renameValue]);

    useEffect(() => {
        if (creating && createRef.current) {
            createRef.current.focus();
        }
    }, [creating]);

    const handleRename = useCallback(async () => {
        if (!renameValue.trim() || renameValue === entry.name) {
            setRenaming(false);
            return;
        }
        const parentDir = entry.path.substring(0, entry.path.lastIndexOf(entry.name));
        const newPath = parentDir + renameValue;
        const result = await window.electronAPI.renameEntry(entry.path, newPath);
        if (result.success) {
            renameTab(entry.path, newPath);
            await refreshTree();
        }
        setRenaming(false);
    }, [renameValue, entry, refreshTree]);

    const handleCreate = useCallback(async () => {
        if (!createValue.trim()) {
            setCreating(null);
            return;
        }
        const basePath = entry.isDirectory ? entry.path : entry.path.substring(0, entry.path.lastIndexOf(entry.name));
        const sep = basePath.includes('/') ? '/' : '\\';
        const newPath = basePath + sep + createValue;

        if (creating === 'file') {
            await window.electronAPI.createFile(newPath);
        } else {
            await window.electronAPI.createFolder(newPath);
        }
        await refreshTree();
        if (entry.isDirectory) setExpanded(true);
        setCreating(null);
        setCreateValue('');
    }, [createValue, creating, entry, refreshTree]);

    const handleDelete = useCallback(async () => {
        const result = await window.electronAPI.deleteEntry(entry.path);
        if (result.success) {
            await refreshTree();
        }
        setContextMenu(null);
    }, [entry, refreshTree]);

    return (
        <li className="file-tree__item" role="treeitem">
            <div
                className={`file-tree__row ${isActive ? 'file-tree__row--active' : ''}`}
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
            >
                {entry.isDirectory && (
                    <span className="file-tree__chevron">
                        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </span>
                )}
                {!entry.isDirectory && <span className="file-tree__chevron-spacer" />}
                <IconComponent size={15} color={iconInfo.color} className="file-tree__icon" />
                {renaming ? (
                    <input
                        ref={renameRef}
                        className="file-tree__rename-input"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleRename}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename();
                            if (e.key === 'Escape') setRenaming(false);
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className="file-tree__name">{entry.name}</span>
                )}
            </div>

            {entry.isDirectory && expanded && entry.children && (
                <FileTree entries={entry.children} depth={depth + 1} />
            )}

            {creating && entry.isDirectory && expanded && (
                <div
                    className="file-tree__row file-tree__create-row"
                    style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
                >
                    <span className="file-tree__chevron-spacer" />
                    {creating === 'folder' ? (
                        <FolderPlus size={14} className="file-tree__icon" color="var(--fg-accent)" />
                    ) : (
                        <FilePlus size={14} className="file-tree__icon" color="var(--fg-accent)" />
                    )}
                    <input
                        ref={createRef}
                        className="file-tree__rename-input"
                        placeholder={creating === 'file' ? 'filename...' : 'folder name...'}
                        value={createValue}
                        onChange={(e) => setCreateValue(e.target.value)}
                        onBlur={handleCreate}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreate();
                            if (e.key === 'Escape') { setCreating(null); setCreateValue(''); }
                        }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}

            {contextMenu && (
                <div
                    ref={menuRef}
                    className="file-tree__context-menu"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                >
                    {entry.isDirectory && (
                        <>
                            <button
                                className="file-tree__context-item"
                                onClick={() => {
                                    setContextMenu(null);
                                    setExpanded(true);
                                    setCreating('file');
                                }}
                            >
                                <FilePlus size={13} /> New File
                            </button>
                            <button
                                className="file-tree__context-item"
                                onClick={() => {
                                    setContextMenu(null);
                                    setExpanded(true);
                                    setCreating('folder');
                                }}
                            >
                                <FolderPlus size={13} /> New Folder
                            </button>
                            <div className="file-tree__context-separator" />
                        </>
                    )}
                    <button
                        className="file-tree__context-item"
                        onClick={() => {
                            setContextMenu(null);
                            setRenameValue(entry.name);
                            setRenaming(true);
                        }}
                    >
                        <Pencil size={13} /> Rename
                    </button>
                    <button
                        className="file-tree__context-item file-tree__context-item--danger"
                        onClick={handleDelete}
                    >
                        <Trash2 size={13} /> Delete
                    </button>
                    {!entry.isDirectory && (
                        <>
                            <div className="file-tree__context-separator" />
                            <button
                                className="file-tree__context-item"
                                onClick={() => {
                                    setContextMenu(null);
                                    reviewFile(entry.path);
                                }}
                            >
                                <Shield size={13} /> AI Review
                            </button>
                        </>
                    )}
                </div>
            )}
        </li>
    );
};
