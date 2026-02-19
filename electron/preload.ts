import { contextBridge, ipcRenderer } from 'electron';
import { IpcChannels, ElectronAPI } from '../shared/types';

const electronAPI: ElectronAPI = {
    // Filesystem
    openFolder: () => ipcRenderer.invoke(IpcChannels.OPEN_FOLDER),
    readDirectory: (dirPath: string) => ipcRenderer.invoke(IpcChannels.READ_DIRECTORY, dirPath),
    readFile: (filePath: string) => ipcRenderer.invoke(IpcChannels.READ_FILE, filePath),
    writeFile: (filePath: string, content: string) =>
        ipcRenderer.invoke(IpcChannels.WRITE_FILE, filePath, content),

    // Terminal
    createTerminal: (cwd?: string) => ipcRenderer.invoke(IpcChannels.TERMINAL_CREATE, cwd),
    writeTerminal: (pid: number, data: string) =>
        ipcRenderer.send(IpcChannels.TERMINAL_WRITE, pid, data),
    resizeTerminal: (pid: number, cols: number, rows: number) =>
        ipcRenderer.send(IpcChannels.TERMINAL_RESIZE, pid, cols, rows),
    disposeTerminal: (pid: number) => ipcRenderer.send(IpcChannels.TERMINAL_DISPOSE, pid),
    onTerminalData: (callback: (pid: number, data: string) => void) => {
        ipcRenderer.on(IpcChannels.TERMINAL_DATA, (_event, pid, data) => callback(pid, data));
    },
    onTerminalExit: (callback: (pid: number, code: number) => void) => {
        ipcRenderer.on(IpcChannels.TERMINAL_EXIT, (_event, pid, code) => callback(pid, code));
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
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
