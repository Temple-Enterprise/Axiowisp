import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useUiStore } from '../stores/ui-store';
import { useWorkspaceStore } from '../stores/workspace-store';
import { useTabsStore } from '../stores/tabs-store';
import { FileEntry } from '../../shared/types';
import { getFileIcon } from '../utils/file-icons';
import {
    Search, FolderOpen, PanelBottom, MessageSquare, PanelLeft,
    Settings, Command,
} from 'lucide-react';
import './CommandPalette.css';

interface PaletteItem {
    id: string;
    label: string;
    description?: string;
    icon: React.ReactNode;
    action: () => void;
}

/** Flatten file tree into a list of file paths */
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
    const openFolder = useWorkspaceStore((s) => s.openFolder);
    const fileTree = useWorkspaceStore((s) => s.fileTree);
    const rootPath = useWorkspaceStore((s) => s.rootPath);
    const openTab = useTabsStore((s) => s.openTab);
    const toggleSettings = useUiStore((s) => s.toggleSettings);

    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // ── Build items list ──────────────────────────────────────
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
                id: 'toggle-sidebar',
                label: 'Toggle Sidebar',
                description: 'Show or hide the file explorer',
                icon: <PanelLeft size={14} />,
                action: () => { closeCommandPalette(); toggleSidebar(); },
            },
            {
                id: 'toggle-terminal',
                label: 'Toggle Terminal',
                description: 'Show or hide the bottom panel',
                icon: <PanelBottom size={14} />,
                action: () => { closeCommandPalette(); toggleBottomPanel(); },
            },
            {
                id: 'toggle-chat',
                label: 'Toggle AI Chat',
                description: 'Show or hide the chat panel',
                icon: <MessageSquare size={14} />,
                action: () => { closeCommandPalette(); toggleChatPanel(); },
            },
            {
                id: 'settings',
                label: 'Settings',
                description: 'Open editor settings',
                icon: <Settings size={14} />,
                action: () => { closeCommandPalette(); toggleSettings(); },
            },
        ],
        [closeCommandPalette, openFolder, toggleSidebar, toggleBottomPanel, toggleChatPanel, toggleSettings],
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

    // ── Filter ────────────────────────────────────────────────
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

    // ── Keyboard nav ──────────────────────────────────────────
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
