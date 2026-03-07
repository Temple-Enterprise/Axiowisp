import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useUiStore } from '../stores/ui-store';
import { useWorkspaceStore } from '../stores/workspace-store';
import { useTabsStore } from '../stores/tabs-store';
import { useOutputStore } from '../stores/output-store';
import { useSettingsStore } from '../stores/settings-store';
import { useBookmarksStore } from '../stores/bookmarks-store';
import { useEditorStore } from '../stores/editor-store';
import { FileEntry } from '../../shared/types';
import { getFileIcon } from '../utils/file-icons';
import {
    Search, FolderOpen, PanelBottom, MessageSquare, PanelLeft,
    Settings, FilePlus, FolderPlus, Save, X as CloseIcon,
    Terminal, AlertTriangle, RefreshCw, Trash2,
    Map, WrapText, Copy, Hash, Replace, RotateCcw,
    Maximize, ArrowUpDown, AlignLeft, Scissors, MergeIcon,
    Navigation, Eye, Pin, Bell, Bookmark, Type, Columns,
    MonitorDown,
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
    const toggleZenMode = useUiStore((s) => s.toggleZenMode);
    const toggleNotificationsPanel = useUiStore((s) => s.toggleNotificationsPanel);
    const openFolder = useWorkspaceStore((s) => s.openFolder);
    const refreshTree = useWorkspaceStore((s) => s.refreshTree);
    const fileTree = useWorkspaceStore((s) => s.fileTree);
    const rootPath = useWorkspaceStore((s) => s.rootPath);
    const openTab = useTabsStore((s) => s.openTab);
    const saveActiveTab = useTabsStore((s) => s.saveActiveTab);
    const closeAllTabs = useTabsStore((s) => s.closeAllTabs);
    const closeActiveTab = useTabsStore((s) => s.closeActiveTab);
    const reopenClosedTab = useTabsStore((s) => s.reopenClosedTab);
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const toggleSettings = useUiStore((s) => s.toggleSettings);
    const setActiveActivity = useUiStore((s) => s.setActiveActivity);
    const clearOutput = useOutputStore((s) => s.clearOutput);
    const minimapEnabled = useSettingsStore((s) => s.minimapEnabled);
    const setMinimapEnabled = useSettingsStore((s) => s.setMinimapEnabled);
    const wordWrap = useSettingsStore((s) => s.wordWrap);
    const setWordWrap = useSettingsStore((s) => s.setWordWrap);
    const stickyScroll = useSettingsStore((s) => s.stickyScroll);
    const setStickyScroll = useSettingsStore((s) => s.setStickyScroll);
    const emmetEnabled = useSettingsStore((s) => s.emmetEnabled);
    const setEmmetEnabled = useSettingsStore((s) => s.setEmmetEnabled);
    const toggleBookmark = useBookmarksStore((s) => s.toggleBookmark);
    const clearBookmarks = useBookmarksStore((s) => s.clearBookmarks);
    const cursorLine = useEditorStore((s) => s.cursorLine);

    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const getEditor = () => (window as any).__axiowisp_editor;

    const commands: PaletteItem[] = useMemo(
        () => [
            {
                id: 'open-folder',
                label: 'Open Folder',
                description: 'Browse and open a project folder',
                icon: <FolderOpen size={14} />,
                action: () => { closeCommandPalette(); openFolder(); },
            },
            {
                id: 'save-file',
                label: 'Save File',
                shortcut: 'Ctrl+S',
                icon: <Save size={14} />,
                action: () => { closeCommandPalette(); saveActiveTab(); },
            },
            {
                id: 'new-file',
                label: 'New File',
                icon: <FilePlus size={14} />,
                action: () => { closeCommandPalette(); setActiveActivity('explorer'); },
            },
            {
                id: 'new-folder',
                label: 'New Folder',
                icon: <FolderPlus size={14} />,
                action: () => { closeCommandPalette(); setActiveActivity('explorer'); },
            },
            {
                id: 'toggle-sidebar',
                label: 'Toggle Sidebar',
                shortcut: 'Ctrl+B',
                icon: <PanelLeft size={14} />,
                action: () => { closeCommandPalette(); toggleSidebar(); },
            },
            {
                id: 'toggle-terminal',
                label: 'Toggle Terminal',
                shortcut: 'Ctrl+J',
                icon: <Terminal size={14} />,
                action: () => { closeCommandPalette(); toggleBottomPanel(); },
            },
            {
                id: 'toggle-chat',
                label: 'Toggle AI Chat',
                shortcut: 'Ctrl+Shift+L',
                icon: <MessageSquare size={14} />,
                action: () => { closeCommandPalette(); toggleChatPanel(); },
            },
            {
                id: 'show-problems',
                label: 'Show Problems',
                icon: <AlertTriangle size={14} />,
                action: () => { closeCommandPalette(); setBottomPanelTab('problems'); toggleBottomPanel(); },
            },
            {
                id: 'close-all-tabs',
                label: 'Close All Tabs',
                icon: <CloseIcon size={14} />,
                action: () => { closeCommandPalette(); closeAllTabs(); },
            },
            {
                id: 'refresh-tree',
                label: 'Refresh File Tree',
                icon: <RefreshCw size={14} />,
                action: () => { closeCommandPalette(); refreshTree(); },
            },
            {
                id: 'clear-output',
                label: 'Clear Output',
                icon: <Trash2 size={14} />,
                action: () => { closeCommandPalette(); clearOutput(); },
            },
            {
                id: 'toggle-scratchpad',
                label: 'Toggle Scratchpad',
                icon: <FilePlus size={14} />,
                action: () => { closeCommandPalette(); setActiveActivity('notepad'); },
            },
            {
                id: 'settings',
                label: 'Settings',
                shortcut: 'Ctrl+,',
                icon: <Settings size={14} />,
                action: () => { closeCommandPalette(); toggleSettings(); },
            },
            {
                id: 'toggle-minimap',
                label: 'Toggle Minimap',
                description: minimapEnabled ? 'Hide the code minimap' : 'Show the code minimap',
                icon: <Map size={14} />,
                action: () => { closeCommandPalette(); setMinimapEnabled(!minimapEnabled); },
            },
            {
                id: 'toggle-word-wrap',
                label: 'Toggle Word Wrap',
                shortcut: 'Alt+Z',
                icon: <WrapText size={14} />,
                action: () => { closeCommandPalette(); setWordWrap(wordWrap === 'off' ? 'on' : 'off'); },
            },
            {
                id: 'duplicate-line',
                label: 'Duplicate Line',
                shortcut: 'Ctrl+Shift+D',
                icon: <Copy size={14} />,
                action: () => { closeCommandPalette(); getEditor()?.getAction('editor.action.copyLinesDownAction')?.run(); },
            },
            {
                id: 'go-to-symbol',
                label: 'Go to Symbol',
                shortcut: 'Ctrl+Shift+O',
                icon: <Hash size={14} />,
                action: () => { closeCommandPalette(); getEditor()?.getAction('editor.action.quickOutline')?.run(); },
            },
            {
                id: 'find-replace',
                label: 'Find and Replace',
                shortcut: 'Ctrl+H',
                icon: <Replace size={14} />,
                action: () => { closeCommandPalette(); getEditor()?.getAction('editor.action.startFindReplaceAction')?.run(); },
            },
            {
                id: 'close-active-tab',
                label: 'Close Tab',
                shortcut: 'Ctrl+W',
                icon: <CloseIcon size={14} />,
                action: () => { closeCommandPalette(); closeActiveTab(); },
            },
            {
                id: 'reopen-closed-tab',
                label: 'Reopen Closed Tab',
                shortcut: 'Ctrl+Shift+T',
                icon: <RotateCcw size={14} />,
                action: () => { closeCommandPalette(); reopenClosedTab(); },
            },
            {
                id: 'zen-mode',
                label: 'Toggle Zen Mode',
                description: 'Distraction-free fullscreen editing',
                shortcut: 'Ctrl+K Z',
                icon: <Maximize size={14} />,
                action: () => { closeCommandPalette(); toggleZenMode(); },
            },
            {
                id: 'toggle-sticky-scroll',
                label: 'Toggle Sticky Scroll',
                description: stickyScroll ? 'Disable sticky scroll' : 'Enable sticky scroll',
                icon: <MonitorDown size={14} />,
                action: () => { closeCommandPalette(); setStickyScroll(!stickyScroll); },
            },
            {
                id: 'transform-upper',
                label: 'Transform to Uppercase',
                icon: <Type size={14} />,
                action: () => { closeCommandPalette(); getEditor()?.getAction('editor.action.transformToUppercase')?.run(); },
            },
            {
                id: 'transform-lower',
                label: 'Transform to Lowercase',
                icon: <Type size={14} />,
                action: () => { closeCommandPalette(); getEditor()?.getAction('editor.action.transformToLowercase')?.run(); },
            },
            {
                id: 'transform-title',
                label: 'Transform to Title Case',
                icon: <Type size={14} />,
                action: () => { closeCommandPalette(); getEditor()?.getAction('editor.action.transformToTitlecase')?.run(); },
            },
            {
                id: 'sort-lines-asc',
                label: 'Sort Lines Ascending',
                icon: <ArrowUpDown size={14} />,
                action: () => { closeCommandPalette(); getEditor()?.getAction('editor.action.sortLinesAscending')?.run(); },
            },
            {
                id: 'sort-lines-desc',
                label: 'Sort Lines Descending',
                icon: <ArrowUpDown size={14} />,
                action: () => { closeCommandPalette(); getEditor()?.getAction('editor.action.sortLinesDescending')?.run(); },
            },
            {
                id: 'trim-whitespace',
                label: 'Trim Trailing Whitespace',
                icon: <AlignLeft size={14} />,
                action: () => { closeCommandPalette(); getEditor()?.getAction('editor.action.trimTrailingWhitespace')?.run(); },
            },
            {
                id: 'join-lines',
                label: 'Join Lines',
                icon: <Scissors size={14} />,
                action: () => { closeCommandPalette(); getEditor()?.getAction('editor.action.joinLines')?.run(); },
            },
            {
                id: 'bracket-jump',
                label: 'Jump to Matching Bracket',
                shortcut: 'Ctrl+Shift+\\',
                icon: <Navigation size={14} />,
                action: () => { closeCommandPalette(); getEditor()?.getAction('editor.action.jumpToBracket')?.run(); },
            },
            {
                id: 'go-to-definition',
                label: 'Go to Definition',
                shortcut: 'F12',
                icon: <Navigation size={14} />,
                action: () => { closeCommandPalette(); getEditor()?.getAction('editor.action.revealDefinition')?.run(); },
            },
            {
                id: 'peek-definition',
                label: 'Peek Definition',
                shortcut: 'Alt+F12',
                icon: <Eye size={14} />,
                action: () => { closeCommandPalette(); getEditor()?.getAction('editor.action.peekDefinition')?.run(); },
            },
            {
                id: 'toggle-bookmark',
                label: 'Toggle Bookmark',
                description: 'Bookmark the current line',
                shortcut: 'Ctrl+F2',
                icon: <Bookmark size={14} />,
                action: () => { closeCommandPalette(); if (activeTabId) toggleBookmark(activeTabId, cursorLine); },
            },
            {
                id: 'clear-bookmarks',
                label: 'Clear All Bookmarks',
                icon: <Bookmark size={14} />,
                action: () => { closeCommandPalette(); clearBookmarks(); },
            },
            {
                id: 'notifications',
                label: 'Show Notifications',
                description: 'View notification history',
                icon: <Bell size={14} />,
                action: () => { closeCommandPalette(); toggleNotificationsPanel(); },
            },
            {
                id: 'toggle-emmet',
                label: 'Toggle Emmet',
                description: emmetEnabled ? 'Disable Emmet abbreviations' : 'Enable Emmet abbreviations',
                icon: <Hash size={14} />,
                action: () => { closeCommandPalette(); setEmmetEnabled(!emmetEnabled); },
            },
        ],
        [closeCommandPalette, openFolder, saveActiveTab, toggleSidebar, toggleBottomPanel,
            toggleChatPanel, toggleSettings, setActiveActivity, setBottomPanelTab,
            closeAllTabs, closeActiveTab, reopenClosedTab, refreshTree, clearOutput,
            minimapEnabled, setMinimapEnabled, wordWrap, setWordWrap, toggleZenMode,
            stickyScroll, setStickyScroll, emmetEnabled, setEmmetEnabled,
            toggleBookmark, clearBookmarks, activeTabId, cursorLine, toggleNotificationsPanel],
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
