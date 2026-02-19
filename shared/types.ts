// ─── IPC Channel Names ───────────────────────────────────────────
export const IpcChannels = {
    OPEN_FOLDER: 'dialog:openFolder',
    READ_DIRECTORY: 'fs:readDirectory',
    READ_FILE: 'fs:readFile',
    WRITE_FILE: 'fs:writeFile',
    // Terminal
    TERMINAL_CREATE: 'terminal:create',
    TERMINAL_WRITE: 'terminal:write',
    TERMINAL_RESIZE: 'terminal:resize',
    TERMINAL_DISPOSE: 'terminal:dispose',
    TERMINAL_DATA: 'terminal:data',     // main → renderer
    TERMINAL_EXIT: 'terminal:exit',     // main → renderer
    // Runner
    RUNNER_EXECUTE: 'runner:execute',
    RUNNER_DATA: 'runner:data',         // main → renderer
    RUNNER_EXIT: 'runner:exit',         // main → renderer
    RUNNER_KILL: 'runner:kill',
} as const;

// ─── File Tree ───────────────────────────────────────────────────
export interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileEntry[];
}

// ─── IPC Result Wrapper ─────────────────────────────────────────
export interface IpcResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

// ─── Tab ─────────────────────────────────────────────────────────
export interface Tab {
    id: string;
    filePath: string;
    fileName: string;
    content: string;
    isDirty: boolean;
    language: string;
}

// ─── Chat ────────────────────────────────────────────────────────
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

// ─── Electron API (exposed via preload) ─────────────────────────
export interface ElectronAPI {
    openFolder: () => Promise<IpcResult<string>>;
    readDirectory: (dirPath: string) => Promise<IpcResult<FileEntry[]>>;
    readFile: (filePath: string) => Promise<IpcResult<string>>;
    writeFile: (filePath: string, content: string) => Promise<IpcResult<void>>;
    // Terminal
    createTerminal: (cwd?: string) => Promise<IpcResult<number>>;
    writeTerminal: (pid: number, data: string) => void;
    resizeTerminal: (pid: number, cols: number, rows: number) => void;
    disposeTerminal: (pid: number) => void;
    onTerminalData: (callback: (pid: number, data: string) => void) => void;
    onTerminalExit: (callback: (pid: number, code: number) => void) => void;
    // Runner
    runCommand: (cmd: string, cwd?: string) => Promise<IpcResult<number>>;
    killRunner: (pid: number) => void;
    onRunnerData: (callback: (pid: number, data: string) => void) => void;
    onRunnerExit: (callback: (pid: number, code: number) => void) => void;
}

// ─── Window augmentation ────────────────────────────────────────
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
