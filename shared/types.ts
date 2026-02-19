// ─── IPC Channel Names ───────────────────────────────────────────
export const IpcChannels = {
    OPEN_FOLDER: 'dialog:openFolder',
    READ_DIRECTORY: 'fs:readDirectory',
    READ_FILE: 'fs:readFile',
    WRITE_FILE: 'fs:writeFile',
    LIST_FILES: 'fs:listFiles',
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
    // Menu
    MENU_ABOUT: 'menu:about',
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
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

// ─── Electron API (exposed via preload) ─────────────────────────
export interface ElectronAPI {
    openFolder: () => Promise<IpcResult<string>>;
    readDirectory: (dirPath: string) => Promise<IpcResult<FileEntry[]>>;
    readFile: (filePath: string) => Promise<IpcResult<string>>;
    writeFile: (filePath: string, content: string) => Promise<IpcResult<void>>;
    listFiles: (dirPath: string) => Promise<IpcResult<string[]>>;
    // Terminal
    createTerminal: (cwd?: string) => Promise<IpcResult<number>>;
    writeTerminal: (id: number, data: string) => void;
    resizeTerminal: (id: number, cols: number, rows: number) => void;
    disposeTerminal: (id: number) => void;
    onTerminalData: (callback: (id: number, data: string) => void) => void;
    onTerminalExit: (callback: (id: number, code: number) => void) => void;
    // Runner
    runCommand: (cmd: string, cwd?: string) => Promise<IpcResult<number>>;
    killRunner: (pid: number) => void;
    onRunnerData: (callback: (pid: number, data: string) => void) => void;
    onRunnerExit: (callback: (pid: number, code: number) => void) => void;
    // Menu
    onAbout: (callback: (data: any) => void) => void;
}

// ─── Window augmentation ────────────────────────────────────────
declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
