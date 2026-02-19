import { useEffect } from 'react';
import { useTabsStore } from '../stores/tabs-store';
import { useUiStore } from '../stores/ui-store';

/**
 * Register global keyboard shortcuts for the IDE.
 * Must be called once from the root component.
 */
export function useKeyboardShortcuts(): void {
    const saveActiveTab = useTabsStore((s) => s.saveActiveTab);
    const toggleSidebar = useUiStore((s) => s.toggleSidebar);
    const toggleBottomPanel = useUiStore((s) => s.toggleBottomPanel);
    const toggleChatPanel = useUiStore((s) => s.toggleChatPanel);
    const openCommandPalette = useUiStore((s) => s.openCommandPalette);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const mod = e.ctrlKey || e.metaKey;
            if (!mod) return;

            switch (e.key.toLowerCase()) {
                case 's':
                    e.preventDefault();
                    saveActiveTab();
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
                case 'l':
                    if (e.shiftKey) {
                        e.preventDefault();
                        toggleChatPanel();
                    }
                    break;
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveActiveTab, toggleSidebar, toggleBottomPanel, toggleChatPanel, openCommandPalette]);
}
