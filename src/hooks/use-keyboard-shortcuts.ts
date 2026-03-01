import { useEffect } from 'react';
import { useTabsStore } from '../stores/tabs-store';
import { useUiStore } from '../stores/ui-store';
import { useSettingsStore } from '../stores/settings-store';
import { useNotificationStore } from '../stores/notification-store';

export function useKeyboardShortcuts(): void {
    const saveActiveTab = useTabsStore((s) => s.saveActiveTab);
    const openDashboard = useTabsStore((s) => s.openDashboard);
    const toggleSidebar = useUiStore((s) => s.toggleSidebar);
    const toggleBottomPanel = useUiStore((s) => s.toggleBottomPanel);
    const toggleChatPanel = useUiStore((s) => s.toggleChatPanel);
    const openCommandPalette = useUiStore((s) => s.openCommandPalette);
    const setEditorFontSize = useSettingsStore((s) => s.setEditorFontSize);
    const editorFontSize = useSettingsStore((s) => s.editorFontSize);
    const addNotification = useNotificationStore((s) => s.addNotification);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const mod = e.ctrlKey || e.metaKey;
            if (!mod) return;

            switch (e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    saveActiveTab().then(() => {
                        addNotification('File saved', 'success', 2000);
                    });
                    break;
                case 'b':
                    e.preventDefault();
                    toggleSidebar();
                    break;
                case 'j':
                    e.preventDefault();
                    toggleBottomPanel();
                    break;
                case 'p':
                    e.preventDefault();
                    openCommandPalette();
                    break;
                case 'd':
                    e.preventDefault();
                    openDashboard();
                    break;
                case 'g':
                    if (!e.shiftKey) {
                        e.preventDefault();
                        if (window.monaco) {
                            const editor = (window as any).__axiowisp_editor;
                            if (editor) {
                                editor.getAction('editor.action.gotoLine')?.run();
                            }
                        }
                    }
                    break;
                case 'l':
                    if (e.shiftKey) {
                        e.preventDefault();
                        toggleChatPanel();
                    }
                    break;
                case '=':
                case '+':
                    e.preventDefault();
                    setEditorFontSize(Math.min(editorFontSize + 1, 32));
                    break;
                case '-':
                    e.preventDefault();
                    setEditorFontSize(Math.max(editorFontSize - 1, 8));
                    break;
            }

            if (e.shiftKey && e.altKey && e.key.toLowerCase() === 'f') {
                e.preventDefault();
                const editor = (window as any).__axiowisp_editor;
                if (editor) {
                    editor.getAction('editor.action.formatDocument')?.run();
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveActiveTab, openDashboard, toggleSidebar, toggleBottomPanel, toggleChatPanel, openCommandPalette, setEditorFontSize, editorFontSize, addNotification]);
}
