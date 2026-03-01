import React, { useEffect } from 'react';
import { useGitStore } from '../stores/git-store';
import { GitBranch, Plus, Minus, Upload, Download, RefreshCw, Loader } from 'lucide-react';
import './GitPanel.css';

export const GitPanel: React.FC = () => {
    const { branch, files, isLoading, error, commitMessage, setCommitMessage, refresh, stage, unstage, commit, push, pull } = useGitStore();

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 10000);
        return () => clearInterval(interval);
    }, []);

    const staged = files.filter((f) => f.staged);
    const unstaged = files.filter((f) => !f.staged);

    const statusColor = (status: string) => {
        if (status === 'M') return '#d29922';
        if (status === 'A' || status === '??') return '#3fb950';
        if (status === 'D') return '#f85149';
        return 'var(--fg-secondary)';
    };

    if (error) {
        return (
            <div className="git-panel">
                <div className="git-panel__header">
                    <GitBranch size={14} />
                    <span>Source Control</span>
                </div>
                <div className="git-panel__empty">
                    <p>Not a git repository</p>
                    <p className="git-panel__error-hint">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="git-panel">
            <div className="git-panel__header">
                <GitBranch size={14} />
                <span className="git-panel__branch">{branch || 'No branch'}</span>
                <div className="git-panel__header-actions">
                    <button className="git-panel__action-btn" onClick={pull} title="Pull" disabled={isLoading}>
                        <Download size={13} />
                    </button>
                    <button className="git-panel__action-btn" onClick={push} title="Push" disabled={isLoading}>
                        <Upload size={13} />
                    </button>
                    <button className="git-panel__action-btn" onClick={refresh} title="Refresh" disabled={isLoading}>
                        {isLoading ? <Loader size={13} className="git-panel__spinner" /> : <RefreshCw size={13} />}
                    </button>
                </div>
            </div>

            <div className="git-panel__commit">
                <input
                    className="git-panel__commit-input"
                    placeholder="Commit message"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commit(); }}
                />
                <button
                    className="git-panel__commit-btn"
                    onClick={commit}
                    disabled={!commitMessage.trim() || staged.length === 0 || isLoading}
                >
                    Commit
                </button>
            </div>

            <div className="git-panel__files">
                {staged.length > 0 && (
                    <div className="git-panel__section">
                        <div className="git-panel__section-header">Staged Changes ({staged.length})</div>
                        {staged.map((f) => (
                            <div key={f.path} className="git-panel__file">
                                <span className="git-panel__file-status" style={{ color: statusColor(f.status) }}>{f.status}</span>
                                <span className="git-panel__file-name">{f.path}</span>
                                <button className="git-panel__file-btn" onClick={() => unstage(f.path)} title="Unstage">
                                    <Minus size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {unstaged.length > 0 && (
                    <div className="git-panel__section">
                        <div className="git-panel__section-header">Changes ({unstaged.length})</div>
                        {unstaged.map((f) => (
                            <div key={f.path} className="git-panel__file">
                                <span className="git-panel__file-status" style={{ color: statusColor(f.status) }}>{f.status}</span>
                                <span className="git-panel__file-name">{f.path}</span>
                                <button className="git-panel__file-btn" onClick={() => stage(f.path)} title="Stage">
                                    <Plus size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {files.length === 0 && !isLoading && (
                    <div className="git-panel__empty">
                        <p>No changes</p>
                    </div>
                )}
            </div>
        </div>
    );
};
