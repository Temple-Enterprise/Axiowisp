import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
    Play, Plus, Trash2, Globe, Clock, FileDigit, Copy, Check, Code2,
    ChevronDown, ChevronRight, Save, FolderOpen, Wifi, WifiOff, Send, X, History, Settings,
} from 'lucide-react';
import { ApiRequestOptions, ApiResponse } from '../../shared/types';
import { useApiStore, substituteEnvVars, SavedRequest } from '../stores/api-store';
import { useActivityStore } from '../stores/activity-store';
import './ApiClient.css';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type RequestTab = 'params' | 'headers' | 'body' | 'auth';
type ResponseTab = 'body' | 'headers';
type AuthType = 'none' | 'bearer' | 'basic' | 'api-key';
type ClientMode = 'rest' | 'ws';

interface KeyValue {
    id: string;
    key: string;
    value: string;
    enabled: boolean;
}

interface WsMessage {
    id: string;
    direction: 'sent' | 'received';
    data: string;
    ts: number;
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
    const [clientMode, setClientMode] = useState<ClientMode>('rest');

    const {
        history, pushHistory, clearHistory,
        environments, activeEnvId, setActiveEnv,
        addEnvironment, removeEnvironment,
        updateEnvVar, addEnvVar, removeEnvVar,
        collections, addCollection, removeCollection,
        saveRequest, removeRequest,
    } = useApiStore();
    const addEvent = useActivityStore((s) => s.addEvent);

    const activeEnv = environments.find(e => e.id === activeEnvId) ?? null;
    const envVars = activeEnv?.vars ?? [];

    const [method, setMethod] = useState<HttpMethod>('GET');
    const [url, setUrl] = useState('');
    const [requestTab, setRequestTab] = useState<RequestTab>('params');
    const [params, setParams] = useState<KeyValue[]>([]);
    const [headers, setHeaders] = useState<KeyValue[]>([]);
    const [body, setBody] = useState('');
    const [authType, setAuthType] = useState<AuthType>('none');
    const [authToken, setAuthToken] = useState('');
    const [authUser, setAuthUser] = useState('');
    const [authPass, setAuthPass] = useState('');
    const [authKeyName, setAuthKeyName] = useState('X-API-Key');
    const [authKeyValue, setAuthKeyValue] = useState('');

    const [responseTab, setResponseTab] = useState<ResponseTab>('body');
    const [prettyMode, setPrettyMode] = useState(true);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [showHistory, setShowHistory] = useState(false);
    const [showCollections, setShowCollections] = useState(false);
    const [showEnvEditor, setShowEnvEditor] = useState(false);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [saveCollectionId, setSaveCollectionId] = useState('');
    const [saveRequestName, setSaveRequestName] = useState('');

    const [wsUrl, setWsUrl] = useState('ws://');
    const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
    const [wsMessages, setWsMessages] = useState<WsMessage[]>([]);
    const [wsSendInput, setWsSendInput] = useState('');
    const wsRef = useRef<WebSocket | null>(null);
    const wsLogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (clientMode !== 'ws' && wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
            setWsStatus('disconnected');
        }
    }, [clientMode]);

    useEffect(() => {
        return () => { wsRef.current?.close(); };
    }, []);

    useEffect(() => {
        if (wsLogRef.current) {
            wsLogRef.current.scrollTop = wsLogRef.current.scrollHeight;
        }
    }, [wsMessages]);

    const makeKv = (): KeyValue => ({ id: crypto.randomUUID(), key: '', value: '', enabled: true });

    const handleKvAdd = useCallback((setter: React.Dispatch<React.SetStateAction<KeyValue[]>>) =>
        setter(prev => [...prev, makeKv()]), []);

    const handleKvUpdate = useCallback((
        setter: React.Dispatch<React.SetStateAction<KeyValue[]>>,
        id: string, field: 'key' | 'value' | 'enabled', value: string | boolean
    ) => setter(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h)), []);

    const handleKvRemove = useCallback((setter: React.Dispatch<React.SetStateAction<KeyValue[]>>, id: string) =>
        setter(prev => prev.filter(h => h.id !== id)), []);

    const paramAdd = useCallback(() => handleKvAdd(setParams), [handleKvAdd]);
    const paramUpdate = useCallback((id: string, f: 'key' | 'value' | 'enabled', v: string | boolean) => handleKvUpdate(setParams, id, f, v), [handleKvUpdate]);
    const paramRemove = useCallback((id: string) => handleKvRemove(setParams, id), [handleKvRemove]);

    const headerAdd = useCallback(() => handleKvAdd(setHeaders), [handleKvAdd]);
    const headerUpdate = useCallback((id: string, f: 'key' | 'value' | 'enabled', v: string | boolean) => handleKvUpdate(setHeaders, id, f, v), [handleKvUpdate]);
    const headerRemove = useCallback((id: string) => handleKvRemove(setHeaders, id), [handleKvRemove]);

    const buildFinalUrl = (): string => {
        const subUrl = substituteEnvVars(url, envVars);
        const active = params.filter(p => p.enabled && p.key.trim());
        if (!active.length) return subUrl;
        try {
            const u = new URL(subUrl);
            active.forEach(p => u.searchParams.set(p.key, p.value));
            return u.toString();
        } catch {
            const qs = active.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
            return `${subUrl}${subUrl.includes('?') ? '&' : '?'}${qs}`;
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
                headerObj[h.key.trim()] = substituteEnvVars(h.value.trim(), envVars);
            });

            const finalBody = method === 'GET' ? undefined : (substituteEnvVars(body.trim(), envVars) || undefined);

            const opts: ApiRequestOptions = {
                method,
                url: buildFinalUrl(),
                headers: Object.keys(headerObj).length ? headerObj : undefined,
                body: finalBody,
            };

            const result = await window.electronAPI.apiRequest(opts);
            if (result.success && result.data) {
                setResponse(result.data);
                setResponseTab('body');
                pushHistory({ timestamp: Date.now(), method, url: url.trim(), status: result.data.status, timeMs: result.data.timeMs });
                addEvent('api-request', `${method} ${url.trim()} → ${result.data.status}`);
            } else {
                setError(result.error || 'An unknown error occurred.');
            }
        } catch (err: any) {
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    const loadSavedRequest = (req: SavedRequest) => {
        setMethod(req.method as HttpMethod);
        setUrl(req.url);
        setParams(req.params.map(p => ({ ...p })));
        setHeaders(req.headers.map(h => ({ ...h })));
        setBody(req.body);
        setAuthType(req.authType as AuthType);
        setAuthToken(req.authToken);
        setAuthUser(req.authUser);
        setAuthPass(req.authPass);
        setAuthKeyName(req.authKeyName);
        setAuthKeyValue(req.authKeyValue);
        setShowCollections(false);
    };

    const handleSaveRequest = () => {
        if (!saveRequestName.trim() || !saveCollectionId) return;
        saveRequest(saveCollectionId, {
            name: saveRequestName.trim(),
            method, url, params, headers, body,
            authType, authToken, authUser, authPass, authKeyName, authKeyValue,
        });
        setSaveRequestName('');
        setShowSaveDialog(false);
    };

    const wsConnect = () => {
        if (!wsUrl.trim() || wsRef.current) return;
        setWsStatus('connecting');
        const ws = new WebSocket(wsUrl.trim());
        wsRef.current = ws;

        ws.onopen = () => {
            setWsStatus('connected');
            addEvent('ws-connect', `Connected to ${wsUrl.trim()}`);
            setWsMessages(prev => [...prev, { id: crypto.randomUUID(), direction: 'received', data: '[Connected]', ts: Date.now() }]);
        };
        ws.onmessage = (e) => {
            setWsMessages(prev => [...prev, { id: crypto.randomUUID(), direction: 'received', data: String(e.data), ts: Date.now() }]);
        };
        ws.onerror = () => {
            setWsMessages(prev => [...prev, { id: crypto.randomUUID(), direction: 'received', data: '[Connection error]', ts: Date.now() }]);
        };
        ws.onclose = () => {
            setWsStatus('disconnected');
            wsRef.current = null;
            setWsMessages(prev => [...prev, { id: crypto.randomUUID(), direction: 'received', data: '[Disconnected]', ts: Date.now() }]);
        };
    };

    const wsDisconnect = () => {
        wsRef.current?.close();
        wsRef.current = null;
        setWsStatus('disconnected');
    };

    const wsSend = () => {
        if (!wsSendInput.trim() || wsStatus !== 'connected' || !wsRef.current) return;
        wsRef.current.send(wsSendInput.trim());
        setWsMessages(prev => [...prev, { id: crypto.randomUUID(), direction: 'sent', data: wsSendInput.trim(), ts: Date.now() }]);
        setWsSendInput('');
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

    const formatTs = (ts: number) =>
        new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const activeParamCount = params.filter(p => p.enabled && p.key.trim()).length;
    const activeHeaderCount = headers.filter(h => h.enabled && h.key.trim()).length;
    const hasBody = body.trim().length > 0;
    const hasAuth = authType !== 'none';
    const requestTabs: RequestTab[] = ['params', 'headers', ...(method !== 'GET' ? ['body' as RequestTab] : []), 'auth'];
    const totalSaved = collections.reduce((a, c) => a + c.requests.length, 0);

    if (clientMode === 'ws') {
        return (
            <div className="api-client">
                <div className="api-client__mode-bar">
                    <button className="api-client__mode-btn" onClick={() => setClientMode('rest')}>REST</button>
                    <button className="api-client__mode-btn active">WS</button>
                </div>

                <div className="api-client__url-section">
                    <input
                        type="text"
                        className="api-client__url-input"
                        placeholder="ws://localhost:8080"
                        value={wsUrl}
                        onChange={e => setWsUrl(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && wsStatus === 'disconnected') wsConnect(); }}
                        disabled={wsStatus !== 'disconnected'}
                    />
                    {wsStatus === 'disconnected' && (
                        <button className="api-client__send-btn" onClick={wsConnect} disabled={!wsUrl.trim()}>
                            <Wifi size={12} /> Connect
                        </button>
                    )}
                    {wsStatus === 'connecting' && (
                        <button className="api-client__send-btn" disabled>
                            <span className="api-client__spinner" /> Connecting
                        </button>
                    )}
                    {wsStatus === 'connected' && (
                        <button className="api-client__send-btn api-client__send-btn--danger" onClick={wsDisconnect}>
                            <WifiOff size={12} /> Disconnect
                        </button>
                    )}
                </div>

                <div className="api-client__ws-status-bar">
                    <span className={`api-client__ws-badge api-client__ws-badge--${wsStatus}`}>
                        <span className="api-client__status-dot" />
                        {wsStatus.charAt(0).toUpperCase() + wsStatus.slice(1)}
                    </span>
                    {wsMessages.length > 0 && (
                        <button className="api-client__pill-btn" onClick={() => setWsMessages([])}>
                            <X size={10} /> Clear
                        </button>
                    )}
                </div>

                <div className="api-client__ws-log" ref={wsLogRef}>
                    {wsMessages.length === 0 && (
                        <div className="api-client__empty-state">
                            <Wifi size={28} strokeWidth={1.5} />
                            <p>Connect to a WebSocket server to start</p>
                        </div>
                    )}
                    {wsMessages.map(msg => (
                        <div key={msg.id} className={`api-client__ws-msg api-client__ws-msg--${msg.direction}`}>
                            <span className="api-client__ws-dir">{msg.direction === 'sent' ? '↑' : '↓'}</span>
                            <span className="api-client__ws-data">{msg.data}</span>
                            <span className="api-client__ws-ts">{formatTs(msg.ts)}</span>
                        </div>
                    ))}
                </div>

                <div className="api-client__ws-send-bar">
                    <input
                        type="text"
                        className="api-client__url-input"
                        placeholder="Message…"
                        value={wsSendInput}
                        onChange={e => setWsSendInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') wsSend(); }}
                        disabled={wsStatus !== 'connected'}
                    />
                    <button
                        className="api-client__send-btn"
                        onClick={wsSend}
                        disabled={wsStatus !== 'connected' || !wsSendInput.trim()}
                    >
                        <Send size={12} /> Send
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="api-client">

            {/* Mode bar */}
            <div className="api-client__mode-bar">
                <button className="api-client__mode-btn active">REST</button>
                <button className="api-client__mode-btn" onClick={() => setClientMode('ws')}>WS</button>
            </div>

            {/* URL Bar */}
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
                <select
                    className="api-client__env-select"
                    value={activeEnvId ?? ''}
                    onChange={e => setActiveEnv(e.target.value || null)}
                    title="Active environment"
                >
                    <option value="">No Env</option>
                    {environments.map(env => (
                        <option key={env.id} value={env.id}>{env.name}</option>
                    ))}
                </select>
                <button
                    className="api-client__send-btn"
                    onClick={handleSubmit}
                    disabled={loading || !url.trim()}
                >
                    {loading ? <span className="api-client__spinner" /> : <Play size={12} fill="currentColor" />}
                    {loading ? 'Sending' : 'Send'}
                </button>
            </div>

            {/* Action Bar */}
            <div className="api-client__action-bar">
                <button
                    className={`api-client__action-btn${showEnvEditor ? ' active' : ''}`}
                    onClick={() => setShowEnvEditor(p => !p)}
                    title="Edit environments"
                >
                    <Settings size={11} />
                    Env{activeEnv ? ` · ${activeEnv.name}` : ''}
                </button>
                <button
                    className={`api-client__action-btn${showCollections ? ' active' : ''}`}
                    onClick={() => { setShowHistory(false); setShowCollections(p => !p); }}
                    title="Collections"
                >
                    <FolderOpen size={11} />
                    Collections
                    {totalSaved > 0 && <span className="api-client__badge">{totalSaved}</span>}
                </button>
                <button
                    className={`api-client__action-btn${showHistory ? ' active' : ''}`}
                    onClick={() => { setShowCollections(false); setShowHistory(p => !p); }}
                    title="Request history"
                >
                    <History size={11} />
                    History
                    {history.length > 0 && <span className="api-client__badge">{history.length}</span>}
                </button>
                <div style={{ flex: 1 }} />
                <button
                    className="api-client__action-btn"
                    onClick={() => { setSaveCollectionId(collections[0]?.id ?? ''); setShowSaveDialog(p => !p); }}
                    title="Save request to collection"
                >
                    <Save size={11} /> Save
                </button>
            </div>

            {/* Env Editor Panel */}
            {showEnvEditor && (
                <div className="api-client__side-panel">
                    <div className="api-client__panel-header">
                        <span>Environments</span>
                        <button
                            className="api-client__action-btn"
                            onClick={() => { const n = prompt('Environment name:'); if (n?.trim()) addEnvironment(n.trim()); }}
                        >
                            <Plus size={11} /> New
                        </button>
                    </div>
                    <div className="api-client__env-tabs">
                        {environments.map(env => (
                            <button
                                key={env.id}
                                className={`api-client__env-tab${env.id === activeEnvId ? ' active' : ''}`}
                                onClick={() => setActiveEnv(env.id === activeEnvId ? null : env.id)}
                            >
                                {env.name}
                                <span
                                    className="api-client__env-del"
                                    onClick={e => { e.stopPropagation(); removeEnvironment(env.id); }}
                                    title="Delete"
                                >
                                    <X size={9} />
                                </span>
                            </button>
                        ))}
                    </div>
                    {activeEnv ? (
                        <div className="api-client__env-vars">
                            {activeEnv.vars.map((v, i) => (
                                <div key={i} className="api-client__kv-row">
                                    <input
                                        className="api-client__kv-input api-client__kv-key"
                                        placeholder="KEY"
                                        value={v.key}
                                        onChange={e => updateEnvVar(activeEnv.id, i, e.target.value, v.value)}
                                    />
                                    <input
                                        className="api-client__kv-input"
                                        placeholder="value"
                                        value={v.value}
                                        onChange={e => updateEnvVar(activeEnv.id, i, v.key, e.target.value)}
                                    />
                                    <button
                                        className="api-client__icon-btn api-client__icon-btn--danger"
                                        onClick={() => removeEnvVar(activeEnv.id, i)}
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            ))}
                            <button className="api-client__add-kv-btn" onClick={() => addEnvVar(activeEnv.id)}>
                                <Plus size={12} /> Add Variable
                            </button>
                        </div>
                    ) : (
                        <p className="api-client__empty-hint" style={{ padding: '6px 12px' }}>Select an environment to edit its variables.</p>
                    )}
                </div>
            )}

            {/* Save Request Dialog */}
            {showSaveDialog && (
                <div className="api-client__save-dialog">
                    <input
                        className="api-client__kv-input"
                        placeholder="Request name"
                        value={saveRequestName}
                        onChange={e => setSaveRequestName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSaveRequest(); if (e.key === 'Escape') setShowSaveDialog(false); }}
                        autoFocus
                        style={{ marginBottom: 6 }}
                    />
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <select
                            className="api-client__auth-select"
                            style={{ flex: 1 }}
                            value={saveCollectionId}
                            onChange={e => setSaveCollectionId(e.target.value)}
                        >
                            <option value="">Select collection…</option>
                            {collections.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <button
                            className="api-client__action-btn"
                            onClick={() => { const n = prompt('Collection name:'); if (n?.trim()) addCollection(n.trim()); }}
                        >
                            <Plus size={11} />
                        </button>
                    </div>
                    <div className="api-client__save-actions">
                        <button
                            className="api-client__send-btn"
                            onClick={handleSaveRequest}
                            disabled={!saveRequestName.trim() || !saveCollectionId}
                        >
                            Save
                        </button>
                        <button className="api-client__pill-btn" onClick={() => { setSaveRequestName(''); setShowSaveDialog(false); }}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Collections Panel */}
            {showCollections && (
                <div className="api-client__side-panel">
                    <div className="api-client__panel-header">
                        <span>Collections</span>
                        <button
                            className="api-client__action-btn"
                            onClick={() => { const n = prompt('Collection name:'); if (n?.trim()) addCollection(n.trim()); }}
                        >
                            <Plus size={11} /> New
                        </button>
                    </div>
                    {collections.length === 0 && (
                        <p className="api-client__empty-hint" style={{ padding: '6px 12px' }}>
                            No collections yet. Use Save to add requests.
                        </p>
                    )}
                    {collections.map(coll => (
                        <div key={coll.id} className="api-client__coll-group">
                            <div className="api-client__coll-header">
                                <FolderOpen size={11} />
                                <span>{coll.name}</span>
                                <span className="api-client__badge">{coll.requests.length}</span>
                                <button
                                    className="api-client__icon-btn api-client__icon-btn--danger"
                                    style={{ marginLeft: 'auto' }}
                                    onClick={() => removeCollection(coll.id)}
                                    title="Delete collection"
                                >
                                    <Trash2 size={10} />
                                </button>
                            </div>
                            {coll.requests.map(req => (
                                <div
                                    key={req.id}
                                    className="api-client__coll-req"
                                    onClick={() => loadSavedRequest(req)}
                                >
                                    <span className={`api-client__coll-method api-client__method--${req.method.toLowerCase()}`}>
                                        {req.method}
                                    </span>
                                    <span className="api-client__coll-name">{req.name}</span>
                                    <button
                                        className="api-client__icon-btn api-client__icon-btn--danger"
                                        onClick={e => { e.stopPropagation(); removeRequest(coll.id, req.id); }}
                                        title="Remove"
                                    >
                                        <Trash2 size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* History Panel */}
            {showHistory && (
                <div className="api-client__side-panel">
                    <div className="api-client__panel-header">
                        <span>History</span>
                        {history.length > 0 && (
                            <button className="api-client__pill-btn" onClick={clearHistory}>
                                <X size={10} /> Clear
                            </button>
                        )}
                    </div>
                    {history.length === 0 && (
                        <p className="api-client__empty-hint" style={{ padding: '6px 12px' }}>No history yet.</p>
                    )}
                    {history.map(entry => (
                        <div
                            key={entry.id}
                            className="api-client__history-entry"
                            onClick={() => { setMethod(entry.method as HttpMethod); setUrl(entry.url); setShowHistory(false); }}
                            title="Click to restore"
                        >
                            <span className={`api-client__coll-method api-client__method--${entry.method.toLowerCase()}`}>
                                {entry.method}
                            </span>
                            <span className="api-client__history-url">{entry.url}</span>
                            <span className={`api-client__status-badge api-client__status--${getStatusClass(entry.status)}`} style={{ fontSize: '10px', padding: '1px 5px' }}>
                                {entry.status}
                            </span>
                        </div>
                    ))}
                </div>
            )}

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
                            {tab === 'params' && activeParamCount > 0 && <span className="api-client__badge">{activeParamCount}</span>}
                            {tab === 'headers' && activeHeaderCount > 0 && <span className="api-client__badge">{activeHeaderCount}</span>}
                            {tab === 'body' && hasBody && <span className="api-client__dot" />}
                            {tab === 'auth' && hasAuth && <span className="api-client__dot" />}
                        </button>
                    ))}
                </div>

                <div className="api-client__tab-content">
                    {requestTab === 'params' && (
                        <KvEditor items={params} onAdd={paramAdd} onUpdate={paramUpdate} onRemove={paramRemove} keyPlaceholder="param" valuePlaceholder="value" />
                    )}
                    {requestTab === 'headers' && (
                        <KvEditor items={headers} onAdd={headerAdd} onUpdate={headerUpdate} onRemove={headerRemove} keyPlaceholder="Header-Name" valuePlaceholder="value" />
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
                            <select className="api-client__auth-select" value={authType} onChange={e => setAuthType(e.target.value as AuthType)}>
                                <option value="none">No Auth</option>
                                <option value="bearer">Bearer Token</option>
                                <option value="basic">Basic Auth</option>
                                <option value="api-key">API Key</option>
                            </select>
                            {authType === 'bearer' && (
                                <input className="api-client__auth-input" type="text" placeholder="Token" value={authToken} onChange={e => setAuthToken(e.target.value)} />
                            )}
                            {authType === 'basic' && (
                                <>
                                    <input className="api-client__auth-input" type="text" placeholder="Username" value={authUser} onChange={e => setAuthUser(e.target.value)} />
                                    <input className="api-client__auth-input" type="password" placeholder="Password" value={authPass} onChange={e => setAuthPass(e.target.value)} />
                                </>
                            )}
                            {authType === 'api-key' && (
                                <>
                                    <input className="api-client__auth-input" type="text" placeholder="Header name (e.g. X-API-Key)" value={authKeyName} onChange={e => setAuthKeyName(e.target.value)} />
                                    <input className="api-client__auth-input" type="text" placeholder="Key value" value={authKeyValue} onChange={e => setAuthKeyValue(e.target.value)} />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Response Section ── */}
            <div className="api-client__response-section">
                <div className="api-client__response-bar">
                    <div className="api-client__tab-bar">
                        <button className={`api-client__tab${responseTab === 'body' ? ' active' : ''}`} onClick={() => setResponseTab('body')}>Body</button>
                        <button className={`api-client__tab${responseTab === 'headers' ? ' active' : ''}`} onClick={() => setResponseTab('headers')}>
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
                                >
                                    <Code2 size={11} />
                                    {prettyMode ? 'Pretty' : 'Raw'}
                                </button>
                            )}
                            <button className="api-client__pill-btn" onClick={handleCopy}>
                                {copied ? <Check size={11} /> : <Copy size={11} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    )}
                </div>

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

                <div className="api-client__response-content">
                    {loading && (
                        <div className="api-client__loading-state">
                            <div className="api-client__loading-dots"><span /><span /><span /></div>
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
