import { create } from 'zustand';

// ── History ──────────────────────────────────────────────
export interface HistoryEntry {
    id: string;
    timestamp: number;
    method: string;
    url: string;
    status: number;
    timeMs: number;
}

// ── Environment Variables ─────────────────────────────────
export interface EnvVar { key: string; value: string; }
export interface Environment {
    id: string;
    name: string;
    vars: EnvVar[];
}

// ── Collections ───────────────────────────────────────────
export interface SavedRequest {
    id: string;
    name: string;
    method: string;
    url: string;
    params: { id: string; key: string; value: string; enabled: boolean }[];
    headers: { id: string; key: string; value: string; enabled: boolean }[];
    body: string;
    authType: string;
    authToken: string;
    authUser: string;
    authPass: string;
    authKeyName: string;
    authKeyValue: string;
}

export interface Collection {
    id: string;
    name: string;
    requests: SavedRequest[];
}

// ── Persistence ───────────────────────────────────────────
const HISTORY_KEY = 'axiowisp-api-history';
const ENV_KEY = 'axiowisp-api-envs';
const COLL_KEY = 'axiowisp-api-collections';
const ACTIVE_ENV_KEY = 'axiowisp-api-active-env';

function loadJson<T>(key: string, fallback: T): T {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function saveJson(key: string, val: unknown) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { }
}

// ── Store ─────────────────────────────────────────────────
interface ApiState {
    // history
    history: HistoryEntry[];
    pushHistory: (entry: Omit<HistoryEntry, 'id'>) => void;
    clearHistory: () => void;

    // environments
    environments: Environment[];
    activeEnvId: string | null;
    addEnvironment: (name: string) => void;
    removeEnvironment: (id: string) => void;
    setActiveEnv: (id: string | null) => void;
    updateEnvVar: (envId: string, index: number, key: string, value: string) => void;
    addEnvVar: (envId: string) => void;
    removeEnvVar: (envId: string, index: number) => void;

    // collections
    collections: Collection[];
    addCollection: (name: string) => void;
    removeCollection: (id: string) => void;
    saveRequest: (collectionId: string, req: Omit<SavedRequest, 'id'>) => void;
    removeRequest: (collectionId: string, requestId: string) => void;
}

export const useApiStore = create<ApiState>((set) => ({
    history: loadJson<HistoryEntry[]>(HISTORY_KEY, []),
    environments: loadJson<Environment[]>(ENV_KEY, [
        { id: 'default', name: 'Development', vars: [{ key: 'BASE_URL', value: 'http://localhost:3000' }] },
    ]),
    activeEnvId: loadJson<string | null>(ACTIVE_ENV_KEY, null),
    collections: loadJson<Collection[]>(COLL_KEY, []),

    pushHistory: (entry) => set((s) => {
        const next = [{ ...entry, id: crypto.randomUUID() }, ...s.history].slice(0, 50);
        saveJson(HISTORY_KEY, next);
        return { history: next };
    }),

    clearHistory: () => set(() => { saveJson(HISTORY_KEY, []); return { history: [] }; }),

    addEnvironment: (name) => set((s) => {
        const next = [...s.environments, { id: crypto.randomUUID(), name, vars: [] }];
        saveJson(ENV_KEY, next);
        return { environments: next };
    }),

    removeEnvironment: (id) => set((s) => {
        const next = s.environments.filter((e) => e.id !== id);
        saveJson(ENV_KEY, next);
        return { environments: next, activeEnvId: s.activeEnvId === id ? null : s.activeEnvId };
    }),

    setActiveEnv: (id) => set(() => { saveJson(ACTIVE_ENV_KEY, id); return { activeEnvId: id }; }),

    updateEnvVar: (envId, index, key, value) => set((s) => {
        const next = s.environments.map((e) => {
            if (e.id !== envId) return e;
            const vars = [...e.vars];
            vars[index] = { key, value };
            return { ...e, vars };
        });
        saveJson(ENV_KEY, next);
        return { environments: next };
    }),

    addEnvVar: (envId) => set((s) => {
        const next = s.environments.map((e) =>
            e.id === envId ? { ...e, vars: [...e.vars, { key: '', value: '' }] } : e
        );
        saveJson(ENV_KEY, next);
        return { environments: next };
    }),

    removeEnvVar: (envId, index) => set((s) => {
        const next = s.environments.map((e) =>
            e.id === envId ? { ...e, vars: e.vars.filter((_, i) => i !== index) } : e
        );
        saveJson(ENV_KEY, next);
        return { environments: next };
    }),

    addCollection: (name) => set((s) => {
        const next = [...s.collections, { id: crypto.randomUUID(), name, requests: [] }];
        saveJson(COLL_KEY, next);
        return { collections: next };
    }),

    removeCollection: (id) => set((s) => {
        const next = s.collections.filter((c) => c.id !== id);
        saveJson(COLL_KEY, next);
        return { collections: next };
    }),

    saveRequest: (collectionId, req) => set((s) => {
        const next = s.collections.map((c) =>
            c.id === collectionId
                ? { ...c, requests: [...c.requests, { ...req, id: crypto.randomUUID() }] }
                : c
        );
        saveJson(COLL_KEY, next);
        return { collections: next };
    }),

    removeRequest: (collectionId, requestId) => set((s) => {
        const next = s.collections.map((c) =>
            c.id === collectionId
                ? { ...c, requests: c.requests.filter((r) => r.id !== requestId) }
                : c
        );
        saveJson(COLL_KEY, next);
        return { collections: next };
    }),
}));

// ── Helper ────────────────────────────────────────────────
export function substituteEnvVars(text: string, vars: EnvVar[]): string {
    let result = text;
    for (const { key, value } of vars) {
        if (key.trim()) result = result.split(`{{${key}}}`).join(value);
    }
    return result;
}
