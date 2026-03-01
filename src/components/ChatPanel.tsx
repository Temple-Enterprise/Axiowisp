import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../stores/chat-store';
import { useUiStore } from '../stores/ui-store';
import { renderMarkdown } from '../utils/markdown';
import { Send, Sparkles, X, Trash2, Loader, Check, FileCode, ChevronDown, ChevronRight } from 'lucide-react';
import './ChatPanel.css';

export const ChatPanel: React.FC = () => {
    const messages = useChatStore((s) => s.messages);
    const isLoading = useChatStore((s) => s.isLoading);
    const sendMessage = useChatStore((s) => s.sendMessage);
    const clearMessages = useChatStore((s) => s.clearMessages);
    const acceptEdit = useChatStore((s) => s.acceptEdit);
    const rejectEdit = useChatStore((s) => s.rejectEdit);
    const toggleChatPanel = useUiStore((s) => s.toggleChatPanel);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        const text = input.trim();
        if (!text || isLoading) return;
        sendMessage(text);
        setInput('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-panel">
            <div className="chat-panel__header">
                <div className="chat-panel__title">
                    <Sparkles size={14} className="chat-panel__title-icon" />
                    <span>AI Chat</span>
                </div>
                <div className="chat-panel__header-actions">
                    <button className="chat-panel__header-btn" onClick={clearMessages} title="Clear">
                        <Trash2 size={13} />
                    </button>
                    <button className="chat-panel__header-btn" onClick={toggleChatPanel} title="Close">
                        <X size={14} />
                    </button>
                </div>
            </div>

            <div className="chat-panel__messages">
                {messages.length === 0 && (
                    <div className="chat-panel__empty">
                        <Sparkles size={28} className="chat-panel__empty-icon" />
                        <p className="chat-panel__empty-title">Axiowisp AI</p>
                        <p className="chat-panel__empty-desc">
                            Ask questions about your code, get suggestions, or request changes.
                        </p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={`chat-panel__msg chat-panel__msg--${msg.role}`}>
                        <div className="chat-panel__msg-header">
                            <span className="chat-panel__msg-role">
                                {msg.role === 'user' ? 'You' : 'Axiowisp'}
                            </span>
                        </div>
                        <div className="chat-panel__msg-body">
                            {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
                        </div>
                        {msg.edits && msg.edits.length > 0 && (
                            <div className="chat-diff-list">
                                {msg.edits.map((edit, i) => (
                                    <DiffBlock
                                        key={`${msg.id}-edit-${i}`}
                                        edit={edit}
                                        onAccept={() => acceptEdit(msg.id, i)}
                                        onReject={() => rejectEdit(msg.id, i)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="chat-panel__msg chat-panel__msg--assistant">
                        <div className="chat-panel__msg-header">
                            <span className="chat-panel__msg-role">Axiowisp</span>
                        </div>
                        <div className="chat-panel__msg-body chat-panel__loading">
                            <Loader size={14} className="chat-panel__spinner" />
                            Thinking…
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-panel__input-area">
                <textarea
                    className="chat-panel__input"
                    placeholder="Ask Axiowisp anything…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    disabled={isLoading}
                />
                <button
                    className="chat-panel__send"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                >
                    <Send size={14} />
                </button>
            </div>
        </div>
    );
};


interface DiffBlockProps {
    edit: {
        filePath: string;
        content: string;
        language: string;
        lineCount: number;
        status: 'pending' | 'accepted' | 'rejected';
    };
    onAccept: () => void;
    onReject: () => void;
}

const DiffBlock: React.FC<DiffBlockProps> = ({ edit, onAccept, onReject }) => {
    const [expanded, setExpanded] = useState(false);
    const fileName = edit.filePath.split(/[\\/]/).pop() ?? edit.filePath;

    const statusClass = `chat-diff--${edit.status}`;
    const lines = edit.content.split('\n');
    const preview = lines.slice(0, 15).join('\n');
    const hasMore = lines.length > 15;

    return (
        <div className={`chat-diff ${statusClass}`}>
            <div className="chat-diff__header">
                <div className="chat-diff__file-info" onClick={() => setExpanded(!expanded)}>
                    {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <FileCode size={13} />
                    <span className="chat-diff__filename">{fileName}</span>
                    <span className="chat-diff__badge">+{edit.lineCount} lines</span>
                </div>
                <div className="chat-diff__actions">
                    {edit.status === 'pending' && (
                        <>
                            <button className="chat-diff__btn chat-diff__btn--accept" onClick={onAccept} title="Accept changes">
                                <Check size={13} /> Accept
                            </button>
                            <button className="chat-diff__btn chat-diff__btn--reject" onClick={onReject} title="Reject changes">
                                <X size={13} /> Reject
                            </button>
                        </>
                    )}
                    {edit.status === 'accepted' && (
                        <span className="chat-diff__status chat-diff__status--accepted">
                            <Check size={12} /> Applied
                        </span>
                    )}
                    {edit.status === 'rejected' && (
                        <span className="chat-diff__status chat-diff__status--rejected">
                            <X size={12} /> Rejected
                        </span>
                    )}
                </div>
            </div>
            {expanded && (
                <div className="chat-diff__body">
                    <pre className="chat-diff__code"><code>{hasMore && !expanded ? preview + '\n...' : edit.content}</code></pre>
                </div>
            )}
            {!expanded && (
                <div className="chat-diff__preview" onClick={() => setExpanded(true)}>
                    <pre className="chat-diff__code chat-diff__code--preview"><code>{preview}{hasMore ? '\n...' : ''}</code></pre>
                </div>
            )}
        </div>
    );
};
