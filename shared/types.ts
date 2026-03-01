export const IpcChannels = {
    OPEN_FOLDER: 'dialog:openFolder',
    READ_DIRECTORY: 'fs:readDirectory',
    READ_FILE: 'fs:readFile',
    WRITE_FILE: 'fs:writeFile',
    LIST_FILES: 'fs:listFiles',
    CREATE_FILE: 'fs:createFile',
    CREATE_FOLDER: 'fs:createFolder',
    RENAME_ENTRY: 'fs:renameEntry',
    DELETE_ENTRY: 'fs:deleteEntry',
    SEARCH_IN_FILES: 'fs:searchInFiles',
    REPLACE_IN_FILE: 'fs:replaceInFile',
    TERMINAL_CREATE: 'terminal:create',
    TERMINAL_WRITE: 'terminal:write',
    TERMINAL_RESIZE: 'terminal:resize',
    TERMINAL_DISPOSE: 'terminal:dispose',
    TERMINAL_EXIT: 'terminal:exit',
    RUNNER_EXECUTE: 'runner:execute',
    RUNNER_EXIT: 'runner:exit',
    RUNNER_KILL: 'runner:kill',
    GIT_STATUS: 'git:status',
    GIT_BRANCH: 'git:branch',
    GIT_STAGE: 'git:stage',
    GIT_UNSTAGE: 'git:unstage',
    GIT_COMMIT: 'git:commit',
    GIT_PUSH: 'git:push',
    GIT_PULL: 'git:pull',
    MENU_ABOUT: 'menu:about',
    MENU_OPEN_FOLDER: 'menu:openFolder',
    MENU_SAVE: 'menu:save',
    MENU_TOGGLE_SIDEBAR: 'menu:toggleSidebar',
    MENU_TOGGLE_BOTTOM_PANEL: 'menu:toggleBottomPanel',
    MENU_TOGGLE_CHAT: 'menu:toggleChat',
    MENU_COMMAND_PALETTE: 'menu:commandPalette',
    MENU_WELCOME: 'menu:welcome',
} as const;

export interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    children?: FileEntry[];
}

export interface IpcResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface Tab {
    id: string;
    filePath: string;
    fileName: string;
    content: string;
    isDirty: boolean;
    language: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

export interface SearchMatch {
    filePath: string;
    lineNumber: number;
    lineContent: string;
    matchStart: number;
    matchEnd: number;
}

export interface GitFileStatus {
    path: string;
    status: string;
    staged: boolean;
}

export interface GitStatus {
    branch: string;
    files: GitFileStatus[];
}

export interface ElectronAPI {
    openFolder: () => Promise<IpcResult<string>>;
    readDirectory: (dirPath: string) => Promise<IpcResult<FileEntry[]>>;
    readFile: (filePath: string) => Promise<IpcResult<string>>;
    writeFile: (filePath: string, content: string) => Promise<IpcResult<void>>;
    listFiles: (dirPath: string) => Promise<IpcResult<string[]>>;
    createFile: (filePath: string) => Promise<IpcResult<void>>;
    createFolder: (dirPath: string) => Promise<IpcResult<void>>;
    renameEntry: (oldPath: string, newPath: string) => Promise<IpcResult<void>>;
    deleteEntry: (targetPath: string) => Promise<IpcResult<void>>;
    searchInFiles: (rootPath: string, query: string, caseSensitive: boolean) => Promise<IpcResult<SearchMatch[]>>;
    replaceInFile: (filePath: string, search: string, replace: string, caseSensitive: boolean) => Promise<IpcResult<number>>;
    createTerminal: (cwd?: string) => Promise<IpcResult<number>>;
    writeTerminal: (id: number, data: string) => void;
    resizeTerminal: (id: number, cols: number, rows: number) => void;
    disposeTerminal: (id: number) => void;
    onTerminalData: (callback: (id: number, data: string) => void) => void;
    onTerminalExit: (callback: (id: number, code: number) => void) => void;
    runCommand: (cmd: string, cwd?: string) => Promise<IpcResult<number>>;
    killRunner: (pid: number) => void;
    onRunnerData: (callback: (pid: number, data: string) => void) => void;
    onRunnerExit: (callback: (pid: number, code: number) => void) => void;
    gitStatus: (cwd: string) => Promise<IpcResult<GitStatus>>;
    gitStage: (cwd: string, filePath: string) => Promise<IpcResult<void>>;
    gitUnstage: (cwd: string, filePath: string) => Promise<IpcResult<void>>;
    gitCommit: (cwd: string, message: string) => Promise<IpcResult<void>>;
    gitPush: (cwd: string) => Promise<IpcResult<void>>;
    gitPull: (cwd: string) => Promise<IpcResult<void>>;
    onAbout: (callback: (data: any) => void) => () => void;
    onMenuOpenFolder: (callback: () => void) => () => void;
    onMenuSave: (callback: () => void) => () => void;
    onMenuToggleSidebar: (callback: () => void) => () => void;
    onMenuToggleBottomPanel: (callback: () => void) => () => void;
    onMenuToggleChat: (callback: () => void) => () => void;
    onMenuCommandPalette: (callback: () => void) => () => void;
    onMenuWelcome: (callback: () => void) => () => void;
    onOpenFile: (callback: (filePath: string) => void) => () => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
        monaco?: any;
    }
}
