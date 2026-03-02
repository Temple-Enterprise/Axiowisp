import React, { useEffect, useState } from 'react';
import { useGitStore } from '../stores/git-store';
import { useSettingsStore } from '../stores/settings-store';
import { useTabsStore } from '../stores/tabs-store';
import { GitBranch, Plus, Minus, Upload, Download, RefreshCw, Loader, Sparkles, GitCompare } from 'lucide-react';
import './GitPanel.css';

function getLanguageFromPath(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = {
        ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
        json: 'json', html: 'html', css: 'css', md: 'markdown',
        py: 'python', rs: 'rust', go: 'go', java: 'java', c: 'c', cpp: 'cpp',
    };
    return map[ext] ?? 'plaintext';
}

async function callAiForCommit(diff: string, provider: string, model: string, apiKey: string): Promise<string> {
    const systemPrompt = 'Write a concise git commit message for this diff. Reply with only the commit message, no explanation.';

    if (provider === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model, max_tokens: 100, system: systemPrompt, messages: [{ role: 'user', content: diff }] }),
        });
        const data = await res.json();
        return data.content?.[0]?.text?.trim() ?? '';
    }

    if (provider === 'gemini') {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt}\n\n${diff}` }] }] }),
        });
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    }

    // OpenAI default
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, max_tokens: 100, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: diff }] }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? '';
}

export const GitPanel: React.FC = () => {
    const { branch, files, isLoading, error, commitMessage, setCommitMessage, refresh, stage, unstage, commit, push, pull } = useGitStore();
    const { activeProvider, openaiApiKey, openaiModel, anthropicApiKey, anthropicModel, geminiApiKey, geminiModel } = useSettingsStore();
    const openDiff = useTabsStore((s) => s.openDiff);

    const [generating, setGenerating] = useState(false);

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

    const handleGenerateCommit = async () => {
        if (staged.length === 0) return;
        const { useWorkspaceStore } = await import('../stores/workspace-store');
        const rootPath = useWorkspaceStore.getState().rootPath;
        if (!rootPath) return;

        setGenerating(true);
        try {
            const result = await window.electronAPI.gitDiffStaged(rootPath);
            if (!result.success || !result.data?.trim()) return;

            const [key, model] = activeProvider === 'anthropic'
                ? [anthropicApiKey, anthropicModel]
                : activeProvider === 'gemini'
                    ? [geminiApiKey, geminiModel]
                    : [openaiApiKey, openaiModel];

            if (!key.trim()) return;
            const msg = await callAiForCommit(result.data, activeProvider, model, key);
            if (msg) setCommitMessage(msg);
        } catch (e) {
            console.error('AI commit generation failed:', e);
        } finally {
            setGenerating(false);
        }
    };

    const handleOpenDiff = async (filePath: string) => {
        const { useWorkspaceStore } = await import('../stores/workspace-store');
        const rootPath = useWorkspaceStore.getState().rootPath;
        if (!rootPath) return;

        const lang = getLanguageFromPath(filePath);
        const separator = rootPath.endsWith('/') || rootPath.endsWith('\\') ? '' : '/';
        const fullPath = `${rootPath}${separator}${filePath}`;

        const [headResult, currentResult] = await Promise.all([
            window.electronAPI.gitShowFile(rootPath, filePath),
            window.electronAPI.readFile(fullPath),
        ]);

        const original = headResult.success ? (headResult.data ?? '') : '';
        const modified = currentResult.success ? (currentResult.data ?? '') : '';

        openDiff(fullPath, original, modified, lang);
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
                    className="git-panel__action-btn git-panel__generate-btn"
                    onClick={handleGenerateCommit}
                    disabled={staged.length === 0 || generating || isLoading}
                    title="Generate commit message with AI"
                >
                    {generating
                        ? <Loader size={13} className="git-panel__spinner" />
                        : <Sparkles size={13} />
                    }
                </button>
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
                                <button className="git-panel__file-btn" onClick={() => handleOpenDiff(f.path)} title="View diff">
                                    <GitCompare size={11} />
                                </button>
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
                                <button className="git-panel__file-btn" onClick={() => handleOpenDiff(f.path)} title="View diff">
                                    <GitCompare size={11} />
                                </button>
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
