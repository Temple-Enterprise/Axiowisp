import React from 'react';
import { Layout } from './components/Layout';
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts';
import { useMenuActions } from './hooks/use-menu-actions';
import { useOutputStore } from './stores/output-store';
import { useTabsStore } from './stores/tabs-store';

export const App: React.FC = () => {
    useKeyboardShortcuts();
    useMenuActions();

    React.useEffect(() => {
        const cleanup = window.electronAPI.onOpenFile((filePath: string) => {
            useTabsStore.getState().openTab(filePath);
        });
        return cleanup;
    }, []);

    React.useEffect(() => {
        const { appendOutput } = useOutputStore.getState();

        const methods = ['log', 'info', 'warn', 'error'] as const;
        const originals = {} as Record<string, any>;

        methods.forEach((method) => {
            originals[method] = console[method];
            console[method] = (...args: any[]) => {
                const text = args
                    .map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a)))
                    .join(' ');

                let prefix = '[info]';
                if (method === 'warn') prefix = '[warn]';
                if (method === 'error') prefix = '[error]';

                appendOutput(`${prefix}  ${text}`);
                originals[method].apply(console, args);
            };
        });

        console.info('Axiowisp IDE started');
        console.info('Renderer loaded successfully');
        console.info('Ready.');

        return () => {
            methods.forEach((method) => {
                console[method] = originals[method];
            });
        };
    }, []);

    return <Layout />;
};
