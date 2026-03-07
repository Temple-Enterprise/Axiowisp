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
    const closeActiveTab = useTabsStore((s) => s.closeActiveTab);
    const reopenClosedTab = useTabsStore((s) => s.reopenClosedTab);
    const activateNextTab = useTabsStore((s) => s.activateNextTab);
    const activatePreviousTab = useTabsStore((s) => s.activatePreviousTab);
    const toggleSidebar = useUiStore((s) => s.toggleSidebar);
    const toggleBottomPanel = useUiStore((s) => s.toggleBottomPanel);
    const toggleChatPanel = useUiStore((s) => s.toggleChatPanel);
    const openCommandPalette = useUiStore((s) => s.openCommandPalette);
    const setEditorFontSize = useSettingsStore((s) => s.setEditorFontSize);
    const editorFontSize = useSettingsStore((s) => s.editorFontSize);
    const wordWrap = useSettingsStore((s) => s.wordWrap);
    const setWordWrap = useSettingsStore((s) => s.setWordWrap);
    const keybindings = useSettingsStore((s) => s.keybindings);
    const addNotification = useNotificationStore((s) => s.addNotification);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const mod = e.ctrlKey || e.metaKey;

            if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                const next = wordWrap === 'off' ? 'on' : 'off';
                setWordWrap(next as 'off' | 'on');
                addNotification(`Word wrap: ${next}`, 'info', 2000);
                return;
            }

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

            if (matchesCombo(e, keybindings.closeTab)) {
                e.preventDefault();
                closeActiveTab();
                return;
            }

            if (matchesCombo(e, keybindings.reopenClosedTab)) {
                e.preventDefault();
                reopenClosedTab();
                return;
            }

            if (e.key === 'Tab' && mod && !e.altKey) {
                e.preventDefault();
                if (e.shiftKey) {
                    activatePreviousTab();
                } else {
                    activateNextTab();
                }
                return;
            }

            if (matchesCombo(e, keybindings.findReplace)) {
                e.preventDefault();
                const editor = (window as any).__axiowisp_editor;
                if (editor) editor.getAction('editor.action.startFindReplaceAction')?.run();
                return;
            }

            if (matchesCombo(e, keybindings.goToSymbol)) {
                e.preventDefault();
                const editor = (window as any).__axiowisp_editor;
                if (editor) editor.getAction('editor.action.quickOutline')?.run();
                return;
            }

            if (matchesCombo(e, keybindings.duplicateLine)) {
                e.preventDefault();
                const editor = (window as any).__axiowisp_editor;
                if (editor) editor.getAction('editor.action.copyLinesDownAction')?.run();
                return;
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveActiveTab, openDashboard, closeActiveTab, reopenClosedTab, activateNextTab, activatePreviousTab, toggleSidebar, toggleBottomPanel, toggleChatPanel, openCommandPalette, setEditorFontSize, editorFontSize, wordWrap, setWordWrap, keybindings, addNotification]);
}
