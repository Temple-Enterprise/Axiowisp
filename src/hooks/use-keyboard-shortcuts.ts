import { useEffect } from 'react';
import { useTabsStore } from '../stores/tabs-store';
import { useUiStore } from '../stores/ui-store';
import { useSettingsStore } from '../stores/settings-store';
import { useNotificationStore } from '../stores/notification-store';
import { useBookmarksStore } from '../stores/bookmarks-store';
import { useEditorStore } from '../stores/editor-store';

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
    const toggleZenMode = useUiStore((s) => s.toggleZenMode);
    const setEditorFontSize = useSettingsStore((s) => s.setEditorFontSize);
    const editorFontSize = useSettingsStore((s) => s.editorFontSize);
    const wordWrap = useSettingsStore((s) => s.wordWrap);
    const setWordWrap = useSettingsStore((s) => s.setWordWrap);
    const keybindings = useSettingsStore((s) => s.keybindings);
    const addNotification = useNotificationStore((s) => s.addNotification);
    const toggleBookmark = useBookmarksStore((s) => s.toggleBookmark);
    const nextBookmark = useBookmarksStore((s) => s.nextBookmark);
    const previousBookmark = useBookmarksStore((s) => s.previousBookmark);
    const cursorLine = useEditorStore((s) => s.cursorLine);
    const activeTabId = useTabsStore((s) => s.activeTabId);

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

            if (e.key === 'Escape' && useUiStore.getState().zenMode) {
                e.preventDefault();
                toggleZenMode();
                return;
            }

            if (!mod && !e.altKey) {
                if (e.key === 'F12' && !e.shiftKey) {
                    e.preventDefault();
                    const editor = (window as any).__axiowisp_editor;
                    if (editor) editor.getAction('editor.action.revealDefinition')?.run();
                    return;
                }

                if (e.key === 'F2' && !e.shiftKey && !e.ctrlKey) {
                    e.preventDefault();
                    if (activeTabId) {
                        const bm = nextBookmark(activeTabId, cursorLine);
                        if (bm) {
                            const editor = (window as any).__axiowisp_editor;
                            if (editor) editor.setPosition({ lineNumber: bm.line, column: 1 });
                        }
                    }
                    return;
                }

                if (e.key === 'F2' && e.shiftKey && !e.ctrlKey) {
                    e.preventDefault();
                    if (activeTabId) {
                        const bm = previousBookmark(activeTabId, cursorLine);
                        if (bm) {
                            const editor = (window as any).__axiowisp_editor;
                            if (editor) editor.setPosition({ lineNumber: bm.line, column: 1 });
                        }
                    }
                    return;
                }
            }

            if (e.altKey && e.key === 'F12' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                const editor = (window as any).__axiowisp_editor;
                if (editor) editor.getAction('editor.action.peekDefinition')?.run();
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

            if (e.ctrlKey && e.shiftKey && e.key === '\\') {
                e.preventDefault();
                const editor = (window as any).__axiowisp_editor;
                if (editor) editor.getAction('editor.action.jumpToBracket')?.run();
                return;
            }

            if (e.ctrlKey && e.key === 'F2' && !e.altKey) {
                e.preventDefault();
                if (activeTabId) {
                    toggleBookmark(activeTabId, cursorLine);
                    addNotification(`Bookmark toggled at line ${cursorLine}`, 'info', 2000);
                }
                return;
            }

            if (e.ctrlKey && e.key === 'k') {
                return;
            }
        }

        function handleKeyUp(e: KeyboardEvent) {
            if (e.key === 'z' && (window as any).__zenPending) {
                (window as any).__zenPending = false;
                toggleZenMode();
            }
        }

        function handleKeySequence(e: KeyboardEvent) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                (window as any).__ctrlKActive = true;
                e.preventDefault();
                setTimeout(() => { (window as any).__ctrlKActive = false; }, 1000);
                return;
            }
            if ((window as any).__ctrlKActive && e.key === 'z') {
                e.preventDefault();
                (window as any).__ctrlKActive = false;
                toggleZenMode();
                addNotification('Zen Mode toggled', 'info', 2000);
                return;
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keydown', handleKeySequence);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keydown', handleKeySequence);
        };
    }, [saveActiveTab, openDashboard, closeActiveTab, reopenClosedTab, activateNextTab, activatePreviousTab, toggleSidebar, toggleBottomPanel, toggleChatPanel, openCommandPalette, toggleZenMode, setEditorFontSize, editorFontSize, wordWrap, setWordWrap, keybindings, addNotification, toggleBookmark, nextBookmark, previousBookmark, cursorLine, activeTabId]);
}
