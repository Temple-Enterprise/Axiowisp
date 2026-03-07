import React, { useMemo } from 'react';
import { useNotepadStore } from '../stores/notepad-store';
import { StickyNote } from 'lucide-react';
import './NotepadPanel.css';

export const NotepadPanel: React.FC = () => {
    const content = useNotepadStore((s) => s.content);
    const setContent = useNotepadStore((s) => s.setContent);

    const stats = useMemo(() => {
        const chars = content.length;
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const lines = content ? content.split('\n').length : 0;
        return { chars, words, lines };
    }, [content]);

    return (
        <div className="notepad-panel">
            <div className="notepad-panel__header">
                <StickyNote size={13} />
                <span>Scratchpad</span>
            </div>
            <textarea
                className="notepad-panel__editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Jot down notes, TODOs, ideas…&#10;&#10;Everything is auto-saved locally."
                spellCheck={false}
            />
            <div className="notepad-panel__footer">
                <span>{stats.lines} lines</span>
                <span>{stats.words} words</span>
                <span>{stats.chars} chars</span>
            </div>
        </div>
    );
};
