import React from 'react';
import { Layout } from './components/Layout';
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts';

export const App: React.FC = () => {
    useKeyboardShortcuts();

    return <Layout />;
};
