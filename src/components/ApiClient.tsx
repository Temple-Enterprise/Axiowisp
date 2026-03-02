import React, { useState } from 'react';
import { Play, Plus, Trash2, Globe, Clock, FileDigit } from 'lucide-react';
import { ApiRequestOptions, ApiResponse } from '../../shared/types';
import './ApiClient.css';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface KeyValue {
    id: string;
    key: string;
    value: string;
}

export const ApiClient: React.FC = () => {
    const [method, setMethod] = useState<HttpMethod>('GET');
    const [url, setUrl] = useState('');
    const [headers, setHeaders] = useState<KeyValue[]>([]);
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleAddHeader = () => {
        setHeaders([...headers, { id: crypto.randomUUID(), key: '', value: '' }]);
    };

    const handleUpdateHeader = (id: string, field: 'key' | 'value', value: string) => {
        setHeaders(headers.map(h => h.id === id ? { ...h, [field]: value } : h));
    };

    const handleRemoveHeader = (id: string) => {
        setHeaders(headers.filter(h => h.id !== id));
    };

    const handleSubmit = async () => {
        if (!url.trim()) return;

        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const headerObj: Record<string, string> = {};
            headers.forEach(h => {
                if (h.key.trim()) {
                    headerObj[h.key.trim()] = h.value.trim();
                }
            });

            const requestOptions: ApiRequestOptions = {
                method,
                url,
                headers: Object.keys(headerObj).length > 0 ? headerObj : undefined,
                body: (method === 'GET' || method === 'HEAD') ? undefined : body,
            };

            const result = await window.electronAPI.apiRequest(requestOptions);

            if (result.success && result.data) {
                setResponse(result.data);
            } else {
                setError(result.error || 'An unknown error occurred.');
            }
        } catch (err: any) {
            setError(err.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    const getStatusColorClass = (status: number) => {
        if (status >= 200 && status < 300) return 'api-client__status--success';
        if (status >= 300 && status < 400) return 'api-client__status--redirect';
        if (status >= 400 && status < 500) return 'api-client__status--client-error';
        return 'api-client__status--server-error';
    };

    return (
        <div className="api-client">
            <div className="api-client__request-section">

                {/* URL and Method Bar */}
                <div className="api-client__url-bar">
                    <select
                        className={`api-client__method-select api-client__method--${method.toLowerCase()}`}
                        value={method}
                        onChange={(e) => setMethod(e.target.value as HttpMethod)}
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
                        placeholder="https://api.example.com/v1/users"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmit();
                        }}
                    />
                    <button
                        className="api-client__send-btn"
                        onClick={handleSubmit}
                        disabled={loading || !url.trim()}
                    >
                        {loading ? <Clock size={14} className="api-client__spin" /> : <Play size={14} />}
                        Send
                    </button>
                </div>

                {/* Headers Section */}
                <div className="api-client__panel">
                    <div className="api-client__panel-header">
                        <span>Headers</span>
                        <button className="api-client__icon-btn" onClick={handleAddHeader} title="Add Header">
                            <Plus size={14} />
                        </button>
                    </div>
                    {headers.length > 0 ? (
                        <div className="api-client__kv-list">
                            {headers.map(h => (
                                <div key={h.id} className="api-client__kv-row">
                                    <input
                                        type="text"
                                        className="api-client__kv-input"
                                        placeholder="Key (e.g. Authorization)"
                                        value={h.key}
                                        onChange={(e) => handleUpdateHeader(h.id, 'key', e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="api-client__kv-input"
                                        placeholder="Value"
                                        value={h.value}
                                        onChange={(e) => handleUpdateHeader(h.id, 'value', e.target.value)}
                                    />
                                    <button
                                        className="api-client__icon-btn api-client__icon-btn--danger"
                                        onClick={() => handleRemoveHeader(h.id)}
                                        title="Remove"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="api-client__empty-hint">No headers added.</div>
                    )}
                </div>

                {/* Body Section */}
                {(method !== 'GET' && method !== 'HEAD') && (
                    <div className="api-client__panel">
                        <div className="api-client__panel-header">
                            <span>Request Body</span>
                        </div>
                        <textarea
                            className="api-client__body-input"
                            placeholder="Enter request body here (JSON, text, etc)..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
                    </div>
                )}
            </div>

            {/* Response Section */}
            <div className="api-client__response-section">
                <div className="api-client__section-title">RESPONSE</div>

                {loading && (
                    <div className="api-client__loading-state">
                        <Clock size={24} className="api-client__spin" />
                        <span>Sending Request...</span>
                    </div>
                )}

                {error && !loading && (
                    <div className="api-client__error-state">
                        <span className="api-client__error-text">{error}</span>
                    </div>
                )}

                {!loading && !response && !error && (
                    <div className="api-client__empty-state">
                        <Globe size={32} />
                        <span>Enter a URL and click Send to see the response.</span>
                    </div>
                )}

                {response && !loading && (
                    <>
                        <div className="api-client__response-meta">
                            <span className={`api-client__status-badge ${getStatusColorClass(response.status)}`}>
                                {response.status} {response.statusText}
                            </span>
                            <span className="api-client__meta-badge">
                                <Clock size={12} /> {response.timeMs} ms
                            </span>
                            <span className="api-client__meta-badge">
                                <FileDigit size={12} /> {formatSize(response.sizeBytes)}
                            </span>
                        </div>

                        <div className="api-client__response-body-wrapper">
                            <pre className="api-client__response-body">
                                {response.body || 'No content returned from server.'}
                            </pre>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
