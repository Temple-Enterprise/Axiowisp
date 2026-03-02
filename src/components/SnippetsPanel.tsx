import React, { useState, useMemo } from 'react';
import { Plus, Trash2, Code, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { useSnippetsStore, Snippet } from '../stores/snippets-store';
import { useTabsStore } from '../stores/tabs-store';
import './SnippetsPanel.css';

export const SnippetsPanel: React.FC = () => {
    const { snippets, addSnippet, removeSnippet } = useSnippetsStore();
    const tabs = useTabsStore((s) => s.tabs);
    const activeTabId = useTabsStore((s) => s.activeTabId);
    const [query, setQuery] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCode, setNewCode] = useState('');

    const activeTab = tabs.find((t) => t.id === activeTabId);

    const filtered = useMemo(() => {
        if (!query.trim()) return snippets;
        const q = query.toLowerCase();
        return snippets.filter(
            (s) => s.name.toLowerCase().includes(q) || s.language.toLowerCase().includes(q)
        );
    }, [snippets, query]);

    const handleInsert = (snippet: Snippet) => {
        const editor = (window as any).__axiowisp_editor;
        if (!editor) return;
        const selection = editor.getSelection();
        editor.executeEdits('snippet-insert', [{
            range: selection,
            text: snippet.code,
            forceMoveMarkers: true,
        }]);
        editor.focus();
    };

    const handleSaveFromEditor = () => {
        const editor = (window as any).__axiowisp_editor;
        if (!editor) return;
        const selection = editor.getSelection();
        const model = editor.getModel();
        if (!model || !selection) return;
        const selected = model.getValueInRange(selection);
        if (!selected.trim()) return;
        const lang = activeTab?.language ?? 'plaintext';
        const name = prompt('Snippet name:');
        if (!name?.trim()) return;
        addSnippet(name.trim(), lang, selected);
    };

    const handleCreate = () => {
        if (!newName.trim() || !newCode.trim()) return;
        addSnippet(newName.trim(), activeTab?.language ?? 'plaintext', newCode);
        setNewName('');
        setNewCode('');
        setCreating(false);
    };

    return (
        <div className="snippets-panel">
            <div className="snippets-panel__toolbar">
                <div className="snippets-panel__search-wrap">
                    <Search size={13} className="snippets-panel__search-icon" />
                    <input
                        className="snippets-panel__search"
                        placeholder="Search snippets…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <button
                    className="snippets-panel__btn"
                    onClick={handleSaveFromEditor}
                    title="Save selection as snippet"
                >
                    <Code size={13} />
                </button>
                <button
                    className="snippets-panel__btn"
                    onClick={() => setCreating((p) => !p)}
                    title="New snippet"
                >
                    <Plus size={13} />
                </button>
            </div>

            {creating && (
                <div className="snippets-panel__create">
                    <input
                        className="snippets-panel__input"
                        placeholder="Snippet name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        autoFocus
                    />
                    <textarea
                        className="snippets-panel__textarea"
                        placeholder="Code…"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        rows={5}
                        spellCheck={false}
                    />
                    <div className="snippets-panel__create-actions">
                        <button className="snippets-panel__save-btn" onClick={handleCreate}>Save</button>
                        <button className="snippets-panel__cancel-btn" onClick={() => setCreating(false)}>Cancel</button>
                    </div>
                </div>
            )}

            <div className="snippets-panel__list">
                {filtered.length === 0 && (
                    <p className="snippets-panel__empty">
                        {query ? 'No snippets match.' : 'No snippets yet. Select code and click the save button.'}
                    </p>
                )}
                {filtered.map((snippet) => (
                    <div key={snippet.id} className="snippets-panel__item">
                        <div
                            className="snippets-panel__item-header"
                            onClick={() => setExpanded(expanded === snippet.id ? null : snippet.id)}
                        >
                            {expanded === snippet.id
                                ? <ChevronDown size={12} />
                                : <ChevronRight size={12} />
                            }
                            <span className="snippets-panel__item-name">{snippet.name}</span>
                            <span className="snippets-panel__item-lang">{snippet.language}</span>
                            <button
                                className="snippets-panel__insert-btn"
                                onClick={(e) => { e.stopPropagation(); handleInsert(snippet); }}
                                title="Insert at cursor"
                            >
                                Insert
                            </button>
                            <button
                                className="snippets-panel__delete-btn"
                                onClick={(e) => { e.stopPropagation(); removeSnippet(snippet.id); }}
                                title="Delete snippet"
                            >
                                <Trash2 size={11} />
                            </button>
                        </div>
                        {expanded === snippet.id && (
                            <pre className="snippets-panel__preview">{snippet.code}</pre>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
