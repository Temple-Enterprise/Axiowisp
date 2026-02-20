import React from 'react';
import { useWorkspaceStore } from '../stores/workspace-store';
import { useUiStore } from '../stores/ui-store';
import { FolderOpen, Command, Sparkles } from 'lucide-react';
import './WelcomeTab.css';

export const WelcomeTab: React.FC = () => {
    const openFolder = useWorkspaceStore((s) => s.openFolder);
    const openCommandPalette = useUiStore((s) => s.openCommandPalette);
    const toggleChatPanel = useUiStore((s) => s.toggleChatPanel);

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
                </div>
            </div>
        </div>
    );
};
