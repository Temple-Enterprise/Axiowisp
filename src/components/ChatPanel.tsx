import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../stores/chat-store';
import { useUiStore } from '../stores/ui-store';
import { Send, Sparkles, X, Trash2, Loader } from 'lucide-react';
import './ChatPanel.css';

export const ChatPanel: React.FC = () => {
    const messages = useChatStore((s) => s.messages);
    const isLoading = useChatStore((s) => s.isLoading);
    const sendMessage = useChatStore((s) => s.sendMessage);
    const clearMessages = useChatStore((s) => s.clearMessages);
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
                        <div className="chat-panel__msg-body">{msg.content}</div>
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
