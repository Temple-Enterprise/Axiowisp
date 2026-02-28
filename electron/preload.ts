import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels, ElectronAPI } from '../shared/types';

const electronAPI: ElectronAPI = {
    // Filesystem
    openFolder: () => ipcRenderer.invoke(IpcChannels.OPEN_FOLDER),
    readDirectory: (dirPath: string) => ipcRenderer.invoke(IpcChannels.READ_DIRECTORY, dirPath),
    readFile: (filePath: string) => ipcRenderer.invoke(IpcChannels.READ_FILE, filePath),
    writeFile: (filePath: string, content: string) =>
        ipcRenderer.invoke(IpcChannels.WRITE_FILE, filePath, content),
    listFiles: (dirPath: string) => ipcRenderer.invoke(IpcChannels.LIST_FILES, dirPath),
    createFile: (filePath: string) => ipcRenderer.invoke(IpcChannels.CREATE_FILE, filePath),
    createFolder: (dirPath: string) => ipcRenderer.invoke(IpcChannels.CREATE_FOLDER, dirPath),
    renameEntry: (oldPath: string, newPath: string) =>
        ipcRenderer.invoke(IpcChannels.RENAME_ENTRY, oldPath, newPath),
    deleteEntry: (targetPath: string) => ipcRenderer.invoke(IpcChannels.DELETE_ENTRY, targetPath),

    // Terminal
    createTerminal: (cwd?: string) => ipcRenderer.invoke(IpcChannels.TERMINAL_CREATE, cwd),
    writeTerminal: (id: number, data: string) =>
        ipcRenderer.send(IpcChannels.TERMINAL_WRITE, id, data),
    resizeTerminal: (id: number, cols: number, rows: number) =>
        ipcRenderer.send(IpcChannels.TERMINAL_RESIZE, id, cols, rows),
    disposeTerminal: (id: number) => ipcRenderer.send(IpcChannels.TERMINAL_DISPOSE, id),
    onTerminalData: (callback: (id: number, data: string) => void) => {
        ipcRenderer.on(IpcChannels.TERMINAL_DATA, (_event, id, data) => callback(id, data));
    },
    onTerminalExit: (callback: (id: number, code: number) => void) => {
        ipcRenderer.on(IpcChannels.TERMINAL_EXIT, (_event, id, code) => callback(id, code));
    },

    // Runner
    runCommand: (cmd: string, cwd?: string) =>
        ipcRenderer.invoke(IpcChannels.RUNNER_EXECUTE, cmd, cwd),
    killRunner: (pid: number) => ipcRenderer.send(IpcChannels.RUNNER_KILL, pid),
    onRunnerData: (callback: (pid: number, data: string) => void) => {
        ipcRenderer.on(IpcChannels.RUNNER_DATA, (_event, pid, data) => callback(pid, data));
    },
    onRunnerExit: (callback: (pid: number, code: number) => void) => {
        ipcRenderer.on(IpcChannels.RUNNER_EXIT, (_event, pid, code) => callback(pid, code));
    },
    // Menu
    onAbout: (callback: (data: any) => void) => {
        const handler = (_event: any, data: any) => callback(data);
        ipcRenderer.on(IpcChannels.MENU_ABOUT, handler);
        return () => ipcRenderer.removeListener(IpcChannels.MENU_ABOUT, handler);
    },
    onMenuOpenFolder: (callback: () => void) => {
        const handler = () => callback();
        ipcRenderer.on(IpcChannels.MENU_OPEN_FOLDER, handler);
        return () => ipcRenderer.removeListener(IpcChannels.MENU_OPEN_FOLDER, handler);
    },
    onMenuSave: (callback: () => void) => {
        const handler = () => callback();
        ipcRenderer.on(IpcChannels.MENU_SAVE, handler);
        return () => ipcRenderer.removeListener(IpcChannels.MENU_SAVE, handler);
    },
    onMenuToggleSidebar: (callback: () => void) => {
        const handler = () => callback();
        ipcRenderer.on(IpcChannels.MENU_TOGGLE_SIDEBAR, handler);
        return () => ipcRenderer.removeListener(IpcChannels.MENU_TOGGLE_SIDEBAR, handler);
    },
    onMenuToggleBottomPanel: (callback: () => void) => {
        const handler = () => callback();
        ipcRenderer.on(IpcChannels.MENU_TOGGLE_BOTTOM_PANEL, handler);
        return () => ipcRenderer.removeListener(IpcChannels.MENU_TOGGLE_BOTTOM_PANEL, handler);
    },
    onMenuToggleChat: (callback: () => void) => {
        const handler = () => callback();
        ipcRenderer.on(IpcChannels.MENU_TOGGLE_CHAT, handler);
        return () => ipcRenderer.removeListener(IpcChannels.MENU_TOGGLE_CHAT, handler);
    },
    onMenuCommandPalette: (callback: () => void) => {
        const handler = () => callback();
        ipcRenderer.on(IpcChannels.MENU_COMMAND_PALETTE, handler);
        return () => ipcRenderer.removeListener(IpcChannels.MENU_COMMAND_PALETTE, handler);
    },
    onMenuWelcome: (callback: () => void) => {
        const handler = () => callback();
        ipcRenderer.on(IpcChannels.MENU_WELCOME, handler);
        return () => ipcRenderer.removeListener(IpcChannels.MENU_WELCOME, handler);
    },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
