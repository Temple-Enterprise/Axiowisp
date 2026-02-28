import React from 'react';
import { useWorkspaceStore } from '../stores/workspace-store';
import { useUiStore } from '../stores/ui-store';
import { FolderOpen, Command, Sparkles, Terminal, Settings, Search } from 'lucide-react';
import './WelcomeTab.css';

interface ShortcutInfo {
    label: string;
    keys: string;
}

const shortcuts: ShortcutInfo[] = [
    { label: 'Command Palette', keys: 'Ctrl+P' },
    { label: 'Open Folder', keys: 'Ctrl+Shift+O' },
    { label: 'Save File', keys: 'Ctrl+S' },
    { label: 'Toggle Terminal', keys: 'Ctrl+`' },
    { label: 'Toggle Sidebar', keys: 'Ctrl+B' },
    { label: 'AI Chat', keys: 'Ctrl+Shift+L' },
    { label: 'Search Files', keys: 'Ctrl+Shift+F' },
    { label: 'Settings', keys: 'Ctrl+,' },
];

export const WelcomeTab: React.FC = () => {
    const openFolder = useWorkspaceStore((s) => s.openFolder);
    const openCommandPalette = useUiStore((s) => s.openCommandPalette);
    const toggleChatPanel = useUiStore((s) => s.toggleChatPanel);
    const toggleBottomPanel = useUiStore((s) => s.toggleBottomPanel);
    const toggleSettings = useUiStore((s) => s.toggleSettings);
    const setActiveActivity = useUiStore((s) => s.setActiveActivity);

    return (
        <div className="welcome">
            <div className="welcome__content">
                <img
                    src="./icon.png"
                    alt="Axiowisp"
                    className="welcome__logo-img"
                />
                <h1 className="welcome__title">Axiowisp</h1>
                <p className="welcome__subtitle">A modern IDE, reimagined.</p>

                <div className="welcome__actions">
                    <button className="welcome__action" onClick={openFolder}>
                        <FolderOpen size={16} />
                        <span>Open Folder</span>
                        <kbd>Ctrl+Shift+O</kbd>
                    </button>
                    <button className="welcome__action" onClick={openCommandPalette}>
                        <Command size={16} />
                        <span>Command Palette</span>
                        <kbd>Ctrl+P</kbd>
                    </button>
                    <button className="welcome__action" onClick={toggleChatPanel}>
                        <Sparkles size={16} />
                        <span>AI Chat</span>
                        <kbd>Ctrl+Shift+L</kbd>
                    </button>
                    <button className="welcome__action" onClick={toggleBottomPanel}>
                        <Terminal size={16} />
                        <span>Open Terminal</span>
                        <kbd>Ctrl+`</kbd>
                    </button>
                    <button className="welcome__action" onClick={() => setActiveActivity('search')}>
                        <Search size={16} />
                        <span>Search Files</span>
                        <kbd>Ctrl+Shift+F</kbd>
                    </button>
                    <button className="welcome__action" onClick={toggleSettings}>
                        <Settings size={16} />
                        <span>Settings</span>
                        <kbd>Ctrl+,</kbd>
                    </button>
                </div>

                <div className="welcome__shortcuts">
                    <h3 className="welcome__shortcuts-title">Keyboard Shortcuts</h3>
                    <div className="welcome__shortcuts-grid">
                        {shortcuts.map((s) => (
                            <div key={s.label} className="welcome__shortcut-row">
                                <span className="welcome__shortcut-label">{s.label}</span>
                                <kbd className="welcome__shortcut-key">{s.keys}</kbd>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
