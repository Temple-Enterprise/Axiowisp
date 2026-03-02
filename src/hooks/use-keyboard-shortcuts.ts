import { useEffect } from 'react';
import { useTabsStore } from '../stores/tabs-store';
import { useUiStore } from '../stores/ui-store';
import { useSettingsStore } from '../stores/settings-store';
import { useNotificationStore } from '../stores/notification-store';

function parseCombo(combo: string): { ctrl: boolean; shift: boolean; alt: boolean; meta: boolean; key: string } {
    const parts = combo.toLowerCase().split('+');
    return {
        ctrl: parts.includes('ctrl'),
        shift: parts.includes('shift'),
        alt: parts.includes('alt'),
        meta: parts.includes('meta'),
        key: parts[parts.length - 1],
    };
}

function matchesCombo(e: KeyboardEvent, combo: string): boolean {
    const parsed = parseCombo(combo);
    return (
        e.ctrlKey === parsed.ctrl &&
        e.shiftKey === parsed.shift &&
        e.altKey === parsed.alt &&
        e.metaKey === parsed.meta &&
        e.key.toLowerCase() === parsed.key
    );
}

export function useKeyboardShortcuts(): void {
    const saveActiveTab = useTabsStore((s) => s.saveActiveTab);
    const openDashboard = useTabsStore((s) => s.openDashboard);
    const toggleSidebar = useUiStore((s) => s.toggleSidebar);
    const toggleBottomPanel = useUiStore((s) => s.toggleBottomPanel);
    const toggleChatPanel = useUiStore((s) => s.toggleChatPanel);
    const openCommandPalette = useUiStore((s) => s.openCommandPalette);
    const setEditorFontSize = useSettingsStore((s) => s.setEditorFontSize);
    const editorFontSize = useSettingsStore((s) => s.editorFontSize);
    const keybindings = useSettingsStore((s) => s.keybindings);
    const addNotification = useNotificationStore((s) => s.addNotification);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const mod = e.ctrlKey || e.metaKey;
            if (!mod) return;

            if (matchesCombo(e, keybindings.save)) {
                e.preventDefault();
                saveActiveTab().then(() => addNotification('File saved', 'success', 2000));
                return;
            }

            if (matchesCombo(e, keybindings.toggleSidebar)) {
                e.preventDefault();
                toggleSidebar();
                return;
            }

            if (matchesCombo(e, keybindings.toggleBottomPanel)) {
                e.preventDefault();
                toggleBottomPanel();
                return;
            }

            if (matchesCombo(e, keybindings.commandPalette)) {
                e.preventDefault();
                openCommandPalette();
                return;
            }

            if (matchesCombo(e, keybindings.dashboard)) {
                e.preventDefault();
                openDashboard();
                return;
            }

            if (matchesCombo(e, keybindings.gotoLine)) {
                e.preventDefault();
                const editor = (window as any).__axiowisp_editor;
                if (editor) editor.getAction('editor.action.gotoLine')?.run();
                return;
            }

            if (matchesCombo(e, keybindings.toggleChat)) {
                e.preventDefault();
                toggleChatPanel();
                return;
            }

            if (matchesCombo(e, keybindings.fontSizeUp)) {
                e.preventDefault();
                setEditorFontSize(Math.min(editorFontSize + 1, 32));
                return;
            }

            if (matchesCombo(e, keybindings.fontSizeDown)) {
                e.preventDefault();
                setEditorFontSize(Math.max(editorFontSize - 1, 8));
                return;
            }

            if (matchesCombo(e, keybindings.formatDocument)) {
                e.preventDefault();
                const editor = (window as any).__axiowisp_editor;
                if (editor) editor.getAction('editor.action.formatDocument')?.run();
                return;
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveActiveTab, openDashboard, toggleSidebar, toggleBottomPanel, toggleChatPanel, openCommandPalette, setEditorFontSize, editorFontSize, keybindings, addNotification]);
}
