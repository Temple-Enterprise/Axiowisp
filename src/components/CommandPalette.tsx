import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useUiStore } from '../stores/ui-store';
import { useWorkspaceStore } from '../stores/workspace-store';
import { useTabsStore } from '../stores/tabs-store';
import { useOutputStore } from '../stores/output-store';
import { FileEntry } from '../../shared/types';
import { getFileIcon } from '../utils/file-icons';
import {
    Search, FolderOpen, PanelBottom, MessageSquare, PanelLeft,
    Settings, FilePlus, FolderPlus, Save, X as CloseIcon,
    Terminal, AlertTriangle, RefreshCw, Trash2,
} from 'lucide-react';
import './CommandPalette.css';

interface PaletteItem {
    id: string;
    label: string;
    description?: string;
    shortcut?: string;
    icon: React.ReactNode;
    action: () => void;
}

function flattenFiles(entries: FileEntry[]): FileEntry[] {
    const result: FileEntry[] = [];
    for (const entry of entries) {
        if (!entry.isDirectory) {
            result.push(entry);
        }
        if (entry.children) {
            result.push(...flattenFiles(entry.children));
        }
    }
    return result;
}

export const CommandPalette: React.FC = () => {
    const closeCommandPalette = useUiStore((s) => s.closeCommandPalette);
    const toggleSidebar = useUiStore((s) => s.toggleSidebar);
    const toggleBottomPanel = useUiStore((s) => s.toggleBottomPanel);
    const toggleChatPanel = useUiStore((s) => s.toggleChatPanel);
    const setBottomPanelTab = useUiStore((s) => s.setBottomPanelTab);
    const openFolder = useWorkspaceStore((s) => s.openFolder);
    const refreshTree = useWorkspaceStore((s) => s.refreshTree);
    const fileTree = useWorkspaceStore((s) => s.fileTree);
    const rootPath = useWorkspaceStore((s) => s.rootPath);
    const openTab = useTabsStore((s) => s.openTab);
    const saveActiveTab = useTabsStore((s) => s.saveActiveTab);
    const closeAllTabs = useTabsStore((s) => s.closeAllTabs);
    const toggleSettings = useUiStore((s) => s.toggleSettings);
    const setActiveActivity = useUiStore((s) => s.setActiveActivity);
    const clearOutput = useOutputStore((s) => s.clearOutput);

    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const commands: PaletteItem[] = useMemo(
        () => [
            {
                id: 'open-folder',
                label: 'Open Folder',
                description: 'Browse and open a project folder',
                shortcut: 'Ctrl+Shift+O',
                icon: <FolderOpen size={14} />,
                action: () => { closeCommandPalette(); openFolder(); },
            },
            {
                id: 'save-file',
                label: 'Save File',
                description: 'Save the current file',
                shortcut: 'Ctrl+S',
                icon: <Save size={14} />,
                action: () => { closeCommandPalette(); saveActiveTab(); },
            },
            {
                id: 'new-file',
                label: 'New File',
                description: 'Create a new file in the explorer',
                icon: <FilePlus size={14} />,
                action: () => { closeCommandPalette(); setActiveActivity('explorer'); },
            },
            {
                id: 'new-folder',
                label: 'New Folder',
                description: 'Create a new folder in the explorer',
                icon: <FolderPlus size={14} />,
                action: () => { closeCommandPalette(); setActiveActivity('explorer'); },
            },
            {
                id: 'toggle-sidebar',
                label: 'Toggle Sidebar',
                description: 'Show or hide the file explorer',
                shortcut: 'Ctrl+B',
                icon: <PanelLeft size={14} />,
                action: () => { closeCommandPalette(); toggleSidebar(); },
            },
            {
                id: 'toggle-terminal',
                label: 'Toggle Terminal',
                description: 'Show or hide the bottom panel',
                shortcut: 'Ctrl+`',
                icon: <Terminal size={14} />,
                action: () => { closeCommandPalette(); toggleBottomPanel(); },
            },
            {
                id: 'toggle-chat',
                label: 'Toggle AI Chat',
                description: 'Show or hide the chat panel',
                shortcut: 'Ctrl+Shift+L',
                icon: <MessageSquare size={14} />,
                action: () => { closeCommandPalette(); toggleChatPanel(); },
            },
            {
                id: 'show-problems',
                label: 'Show Problems',
                description: 'Show errors and warnings',
                icon: <AlertTriangle size={14} />,
                action: () => { closeCommandPalette(); setBottomPanelTab('problems'); toggleBottomPanel(); },
            },
            {
                id: 'close-all-tabs',
                label: 'Close All Tabs',
                description: 'Close all open editor tabs',
                icon: <CloseIcon size={14} />,
                action: () => { closeCommandPalette(); closeAllTabs(); },
            },
            {
                id: 'refresh-tree',
                label: 'Refresh File Tree',
                description: 'Refresh the explorer file tree',
                icon: <RefreshCw size={14} />,
                action: () => { closeCommandPalette(); refreshTree(); },
            },
            {
                id: 'clear-output',
                label: 'Clear Output',
                description: 'Clear the output log',
                icon: <Trash2 size={14} />,
                action: () => { closeCommandPalette(); clearOutput(); },
            },
            {
                id: 'settings',
                label: 'Settings',
                description: 'Open editor settings',
                shortcut: 'Ctrl+,',
                icon: <Settings size={14} />,
                action: () => { closeCommandPalette(); toggleSettings(); },
            },
        ],
        [closeCommandPalette, openFolder, saveActiveTab, toggleSidebar, toggleBottomPanel,
            toggleChatPanel, toggleSettings, setActiveActivity, setBottomPanelTab,
            closeAllTabs, refreshTree, clearOutput],
    );

    const fileItems: PaletteItem[] = useMemo(() => {
        if (!rootPath) return [];
        return flattenFiles(fileTree).map((f) => {
            const iconInfo = getFileIcon(f.name, false);
            const Icon = iconInfo.icon;
            const relativePath = f.path.replace(rootPath, '').replace(/^[\\/]/, '');
            return {
                id: `file:${f.path}`,
                label: f.name,
                description: relativePath,
                icon: <Icon size={14} color={iconInfo.color} />,
                action: () => { closeCommandPalette(); openTab(f.path); },
            };
        });
    }, [fileTree, rootPath, closeCommandPalette, openTab]);

    const allItems = useMemo(() => [...fileItems, ...commands], [fileItems, commands]);

    const filtered = useMemo(() => {
        if (!query.trim()) return allItems.slice(0, 50);
        const q = query.toLowerCase();
        return allItems
            .filter(
                (item) =>
                    item.label.toLowerCase().includes(q) ||
                    (item.description?.toLowerCase().includes(q) ?? false),
            )
            .slice(0, 50);
    }, [query, allItems]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((i) => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                filtered[selectedIndex]?.action();
                break;
            case 'Escape':
                e.preventDefault();
                closeCommandPalette();
                break;
        }
    };

    return (
        <div className="command-palette__overlay" onClick={closeCommandPalette}>
            <div className="command-palette" onClick={(e) => e.stopPropagation()}>
                <div className="command-palette__input-row">
                    <Search size={15} className="command-palette__search-icon" />
                    <input
                        ref={inputRef}
                        className="command-palette__input"
                        placeholder="Search files or type a command…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <kbd className="command-palette__kbd">esc</kbd>
                </div>
                <ul className="command-palette__list" role="listbox">
                    {filtered.map((item, i) => (
                        <li
                            key={item.id}
                            className={`command-palette__item ${i === selectedIndex ? 'command-palette__item--selected' : ''}`}
                            onClick={item.action}
                            onMouseEnter={() => setSelectedIndex(i)}
                            role="option"
                            aria-selected={i === selectedIndex}
                        >
                            <span className="command-palette__item-icon">{item.icon}</span>
                            <span className="command-palette__item-label">{item.label}</span>
                            {item.description && (
                                <span className="command-palette__item-desc">{item.description}</span>
                            )}
                            {item.shortcut && (
                                <kbd className="command-palette__item-shortcut">{item.shortcut}</kbd>
                            )}
                        </li>
                    ))}
                    {filtered.length === 0 && (
                        <li className="command-palette__empty">No results found</li>
                    )}
                </ul>
            </div>
        </div>
    );
};
