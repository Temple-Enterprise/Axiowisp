import React, { useState, useMemo, useCallback } from 'react';
import { Play, Plus, Trash2, Globe, Clock, FileDigit, Copy, Check, Code2 } from 'lucide-react';
import { ApiRequestOptions, ApiResponse } from '../../shared/types';
import './ApiClient.css';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type RequestTab = 'params' | 'headers' | 'body' | 'auth';
type ResponseTab = 'body' | 'headers';
type AuthType = 'none' | 'bearer' | 'basic' | 'api-key';

interface KeyValue {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
}

interface KvEditorProps {
    items: KeyValue[];
    onAdd: () => void;
    onUpdate: (id: string, field: 'key' | 'value' | 'enabled', value: string | boolean) => void;
    onRemove: (id: string) => void;
    keyPlaceholder?: string;
    valuePlaceholder?: string;
}

const KvEditor: React.FC<KvEditorProps> = ({
    items, onAdd, onUpdate, onRemove,
    keyPlaceholder = 'Key',
    valuePlaceholder = 'Value',
}) => (
    <div className="api-client__kv-editor">
        {items.length > 0 && (
            <div className="api-client__kv-list">
                {items.map(item => (
                    <div key={item.id} className={`api-client__kv-row${!item.enabled ? ' disabled' : ''}`}>
                        <button
                            className={`api-client__kv-toggle${item.enabled ? ' active' : ''}`}
                            onClick={() => onUpdate(item.id, 'enabled', !item.enabled)}
                            title={item.enabled ? 'Disable' : 'Enable'}
                        />
                        <input
                            type="text"
                            className="api-client__kv-input api-client__kv-key"
                            placeholder={keyPlaceholder}
                            value={item.key}
                            onChange={e => onUpdate(item.id, 'key', e.target.value)}
                        />
                        <input
                            type="text"
                            className="api-client__kv-input"
                            placeholder={valuePlaceholder}
                            value={item.value}
                            onChange={e => onUpdate(item.id, 'value', e.target.value)}
                        />
                        <button
                            className="api-client__icon-btn api-client__icon-btn--danger"
                            onClick={() => onRemove(item.id)}
                            title="Remove"
                        >
                            <Trash2 size={11} />
                        </button>
                    </div>
                ))}
            </div>
        )}
        {items.length === 0 && (
            <p className="api-client__empty-hint">No items. Click Add to create one.</p>
        )}
        <button className="api-client__add-kv-btn" onClick={onAdd}>
            <Plus size={12} /> Add
        </button>
    </div>
);

export const ApiClient: React.FC = () => {
    const [method, setMethod] = useState<HttpMethod>('GET');
    const [url, setUrl] = useState('');

    // Request tabs
    const [requestTab, setRequestTab] = useState<RequestTab>('params');
    const [params, setParams] = useState<KeyValue[]>([]);
    const [headers, setHeaders] = useState<KeyValue[]>([]);
    const [body, setBody] = useState('');

    // Auth
    const [authType, setAuthType] = useState<AuthType>('none');
    const [authToken, setAuthToken] = useState('');
    const [authUser, setAuthUser] = useState('');
    const [authPass, setAuthPass] = useState('');
    const [authKeyName, setAuthKeyName] = useState('X-API-Key');
    const [authKeyValue, setAuthKeyValue] = useState('');

    // Response
    const [responseTab, setResponseTab] = useState<ResponseTab>('body');
    const [prettyMode, setPrettyMode] = useState(true);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const makeKv = (): KeyValue => ({ id: crypto.randomUUID(), key: '', value: '', enabled: true });

    const handleKvAdd = useCallback((setter: React.Dispatch<React.SetStateAction<KeyValue[]>>) =>
        setter(prev => [...prev, makeKv()]), []);

    const handleKvUpdate = useCallback((
        setter: React.Dispatch<React.SetStateAction<KeyValue[]>>,
        id: string, field: 'key' | 'value' | 'enabled', value: string | boolean
    ) => setter(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h)), []);

    const handleKvRemove = useCallback((setter: React.Dispatch<React.SetStateAction<KeyValue[]>>, id: string) =>
        setter(prev => prev.filter(h => h.id !== id)), []);

    // Stable callbacks for KvEditor instances
    const paramAdd    = useCallback(() => handleKvAdd(setParams), [handleKvAdd]);
    const paramUpdate = useCallback((id: string, f: 'key' | 'value' | 'enabled', v: string | boolean) => handleKvUpdate(setParams, id, f, v), [handleKvUpdate]);
    const paramRemove = useCallback((id: string) => handleKvRemove(setParams, id), [handleKvRemove]);

    const headerAdd    = useCallback(() => handleKvAdd(setHeaders), [handleKvAdd]);
    const headerUpdate = useCallback((id: string, f: 'key' | 'value' | 'enabled', v: string | boolean) => handleKvUpdate(setHeaders, id, f, v), [handleKvUpdate]);
    const headerRemove = useCallback((id: string) => handleKvRemove(setHeaders, id), [handleKvRemove]);

    const buildFinalUrl = (): string => {
        const active = params.filter(p => p.enabled && p.key.trim());
        if (!active.length) return url;
        try {
            const u = new URL(url);
            active.forEach(p => u.searchParams.set(p.key, p.value));
            return u.toString();
        } catch {
            const qs = active.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
            return `${url}${url.includes('?') ? '&' : '?'}${qs}`;
        }
    };

    const handleSubmit = async () => {
        if (!url.trim()) return;
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const headerObj: Record<string, string> = {};

            if (authType === 'bearer' && authToken.trim()) {
                headerObj['Authorization'] = `Bearer ${authToken.trim()}`;
            } else if (authType === 'basic') {
                headerObj['Authorization'] = `Basic ${btoa(`${authUser}:${authPass}`)}`;
            } else if (authType === 'api-key' && authKeyName.trim() && authKeyValue.trim()) {
                headerObj[authKeyName.trim()] = authKeyValue.trim();
            }

            headers.filter(h => h.enabled && h.key.trim()).forEach(h => {
                headerObj[h.key.trim()] = h.value.trim();
            });

            const opts: ApiRequestOptions = {
                method,
                url: buildFinalUrl(),
                headers: Object.keys(headerObj).length ? headerObj : undefined,
                body: method === 'GET' ? undefined : (body.trim() || undefined),
            };

            const result = await window.electronAPI.apiRequest(opts);
            if (result.success && result.data) {
                setResponse(result.data);
                setResponseTab('body');
            } else {
                setError(result.error || 'An unknown error occurred.');
            }
        } catch (err: any) {
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const getStatusClass = (status: number) =>
        status >= 200 && status < 300 ? 'success' :
        status >= 300 && status < 400 ? 'redirect' :
        status >= 400 && status < 500 ? 'client-error' : 'server-error';

    const prettyJson = useMemo(() => {
        if (!response?.body) return null;
        try { return JSON.stringify(JSON.parse(response.body), null, 2); }
        catch { return null; }
    }, [response?.body]);

    const highlightJson = (json: string): string => {
        const escaped = json
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return escaped.replace(
            /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
            match => {
                if (/^"/.test(match)) {
                    return /:$/.test(match)
                        ? `<span class="json-key">${match}</span>`
                        : `<span class="json-string">${match}</span>`;
                }
                if (/true|false/.test(match)) return `<span class="json-boolean">${match}</span>`;
                if (match === 'null') return `<span class="json-null">${match}</span>`;
                return `<span class="json-number">${match}</span>`;
            }
        );
    };

    const handleCopy = () => {
        const text = prettyMode && prettyJson ? prettyJson : (response?.body ?? '');
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        });
    };

    const activeParamCount  = params.filter(p => p.enabled && p.key.trim()).length;
    const activeHeaderCount = headers.filter(h => h.enabled && h.key.trim()).length;
    const hasBody = body.trim().length > 0;
    const hasAuth = authType !== 'none';

    const requestTabs: RequestTab[] = ['params', 'headers', ...(method !== 'GET' ? ['body' as RequestTab] : []), 'auth'];

    return (
        <div className="api-client">

            {/* ── URL Bar ── */}
            <div className="api-client__url-section">
                <select
                    className={`api-client__method-select api-client__method--${method.toLowerCase()}`}
                    value={method}
                    onChange={e => setMethod(e.target.value as HttpMethod)}
                >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                </select>
                <input
                    type="text"
                    className="api-client__url-input"
                    placeholder="https://api.example.com/v1/resource"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
                />
                <button
                    className="api-client__send-btn"
                    onClick={handleSubmit}
                    disabled={loading || !url.trim()}
                >
                    {loading
                        ? <span className="api-client__spinner" />
                        : <Play size={12} fill="currentColor" />
                    }
                    {loading ? 'Sending' : 'Send'}
                </button>
            </div>

            {/* ── Request Tabs ── */}
            <div className="api-client__request-section">
                <div className="api-client__tab-bar">
                    {requestTabs.map(tab => (
                        <button
                            key={tab}
                            className={`api-client__tab${requestTab === tab ? ' active' : ''}`}
                            onClick={() => setRequestTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            {tab === 'params'  && activeParamCount  > 0 && <span className="api-client__badge">{activeParamCount}</span>}
                            {tab === 'headers' && activeHeaderCount > 0 && <span className="api-client__badge">{activeHeaderCount}</span>}
                            {tab === 'body'    && hasBody                && <span className="api-client__dot" />}
                            {tab === 'auth'    && hasAuth               && <span className="api-client__dot" />}
                        </button>
                    ))}
                </div>

                <div className="api-client__tab-content">
                    {requestTab === 'params' && (
                        <KvEditor
                            items={params}
                            onAdd={paramAdd}
                            onUpdate={paramUpdate}
                            onRemove={paramRemove}
                            keyPlaceholder="param"
                            valuePlaceholder="value"
                        />
                    )}
                    {requestTab === 'headers' && (
                        <KvEditor
                            items={headers}
                            onAdd={headerAdd}
                            onUpdate={headerUpdate}
                            onRemove={headerRemove}
                            keyPlaceholder="Header-Name"
                            valuePlaceholder="value"
                        />
                    )}
                    {requestTab === 'body' && method !== 'GET' && (
                        <textarea
                            className="api-client__body-input"
                            placeholder={'{\n  "key": "value"\n}'}
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            spellCheck={false}
                        />
                    )}
                    {requestTab === 'auth' && (
                        <div className="api-client__auth">
                            <select
                                className="api-client__auth-select"
                                value={authType}
                                onChange={e => setAuthType(e.target.value as AuthType)}
                            >
                                <option value="none">No Auth</option>
                                <option value="bearer">Bearer Token</option>
                                <option value="basic">Basic Auth</option>
                                <option value="api-key">API Key</option>
                            </select>
                            {authType === 'bearer' && (
                                <input
                                    className="api-client__auth-input"
                                    type="text"
                                    placeholder="Token"
                                    value={authToken}
                                    onChange={e => setAuthToken(e.target.value)}
                                />
                            )}
                            {authType === 'basic' && (
                                <>
                                    <input className="api-client__auth-input" type="text"     placeholder="Username" value={authUser} onChange={e => setAuthUser(e.target.value)} />
                                    <input className="api-client__auth-input" type="password" placeholder="Password" value={authPass} onChange={e => setAuthPass(e.target.value)} />
                                </>
                            )}
                            {authType === 'api-key' && (
                                <>
                                    <input className="api-client__auth-input" type="text" placeholder="Header name (e.g. X-API-Key)" value={authKeyName}  onChange={e => setAuthKeyName(e.target.value)} />
                                    <input className="api-client__auth-input" type="text" placeholder="Key value"                    value={authKeyValue} onChange={e => setAuthKeyValue(e.target.value)} />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Response Section ── */}
            <div className="api-client__response-section">

                {/* Response bar: tabs + actions */}
                <div className="api-client__response-bar">
                    <div className="api-client__tab-bar">
                        <button
                            className={`api-client__tab${responseTab === 'body' ? ' active' : ''}`}
                            onClick={() => setResponseTab('body')}
                        >
                            Body
                        </button>
                        <button
                            className={`api-client__tab${responseTab === 'headers' ? ' active' : ''}`}
                            onClick={() => setResponseTab('headers')}
                        >
                            Headers
                            {response && Object.keys(response.headers).length > 0 && (
                                <span className="api-client__badge">{Object.keys(response.headers).length}</span>
                            )}
                        </button>
                    </div>

                    {response && (
                        <div className="api-client__response-actions">
                            {responseTab === 'body' && prettyJson && (
                                <button
                                    className={`api-client__pill-btn${prettyMode ? ' active' : ''}`}
                                    onClick={() => setPrettyMode(p => !p)}
                                    title={prettyMode ? 'Switch to Raw' : 'Switch to Pretty'}
                                >
                                    <Code2 size={11} />
                                    {prettyMode ? 'Pretty' : 'Raw'}
                                </button>
                            )}
                            <button className="api-client__pill-btn" onClick={handleCopy} title="Copy response">
                                {copied ? <Check size={11} /> : <Copy size={11} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Status meta strip */}
                {response && !loading && (
                    <div className="api-client__response-meta">
                        <span className={`api-client__status-badge api-client__status--${getStatusClass(response.status)}`}>
                            <span className="api-client__status-dot" />
                            {response.status} {response.statusText}
                        </span>
                        <span className="api-client__meta-chip"><Clock size={10} />{response.timeMs} ms</span>
                        <span className="api-client__meta-chip"><FileDigit size={10} />{formatSize(response.sizeBytes)}</span>
                    </div>
                )}

                {/* Content area */}
                <div className="api-client__response-content">
                    {loading && (
                        <div className="api-client__loading-state">
                            <div className="api-client__loading-dots">
                                <span /><span /><span />
                            </div>
                            <span>Sending request…</span>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="api-client__error-state">
                            <div className="api-client__error-badge">Error</div>
                            <pre className="api-client__error-text">{error}</pre>
                        </div>
                    )}

                    {!loading && !response && !error && (
                        <div className="api-client__empty-state">
                            <Globe size={28} strokeWidth={1.5} />
                            <p>Send a request to see the response</p>
                        </div>
                    )}

                    {!loading && response && responseTab === 'body' && (
                        <pre className="api-client__response-body">
                            {prettyMode && prettyJson
                                ? <code dangerouslySetInnerHTML={{ __html: highlightJson(prettyJson) }} />
                                : <code>{response.body || <em className="api-client__no-content">Empty response body</em>}</code>
                            }
                        </pre>
                    )}

                    {!loading && response && responseTab === 'headers' && (
                        <div className="api-client__headers-table">
                            {Object.entries(response.headers).length === 0
                                ? <p className="api-client__empty-hint">No response headers.</p>
                                : Object.entries(response.headers).map(([k, v]) => (
                                    <div key={k} className="api-client__header-row">
                                        <span className="api-client__header-key">{k}</span>
                                        <span className="api-client__header-val">{v}</span>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
