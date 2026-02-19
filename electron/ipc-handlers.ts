import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as pty from 'node-pty';
import { spawn, ChildProcess } from 'child_process';
import { IpcChannels, FileEntry, IpcResult } from '../shared/types';

// Directories/files to skip when scanning a project tree
const IGNORE_PATTERNS = new Set([
    'node_modules', '.git', '.next', '.vite', 'dist', 'dist-electron',
    '__pycache__', '.DS_Store', 'Thumbs.db', '.cache', '.parcel-cache',
    'coverage', '.nyc_output', '.turbo',
]);

// Track active terminals and runners
const terminals = new Map<number, pty.IPty>();
const runners = new Map<number, ChildProcess>();

/** Register all IPC handlers on the main process. */
export function registerIpcHandlers(): void {
    const getWindow = () => BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];

    // ── Open Folder Dialog ──────────────────────────────────────
    ipcMain.handle(IpcChannels.OPEN_FOLDER, async (): Promise<IpcResult<string>> => {
        try {
            const win = getWindow();
            const result = await dialog.showOpenDialog(win!, {
                properties: ['openDirectory'],
                title: 'Open Folder',
            });
            if (result.canceled || result.filePaths.length === 0) {
                return { success: false, error: 'No folder selected' };
            }
            return { success: true, data: result.filePaths[0] };
        } catch (err: any) {
            return { success: false, error: err.message ?? String(err) };
        }
    });

    // ── Read Directory (recursive) ──────────────────────────────
    ipcMain.handle(
        IpcChannels.READ_DIRECTORY,
        async (_event, dirPath: string): Promise<IpcResult<FileEntry[]>> => {
            try {
                const tree = readDirectorySync(dirPath);
                return { success: true, data: tree };
            } catch (err: any) {
                return { success: false, error: err.message ?? String(err) };
            }
        },
    );

    // ── Read File ───────────────────────────────────────────────
    ipcMain.handle(
        IpcChannels.READ_FILE,
        async (_event, filePath: string): Promise<IpcResult<string>> => {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                return { success: true, data: content };
            } catch (err: any) {
                return { success: false, error: err.message ?? String(err) };
            }
        },
    );

    // ── Write File ──────────────────────────────────────────────
    ipcMain.handle(
        IpcChannels.WRITE_FILE,
        async (_event, filePath: string, content: string): Promise<IpcResult<void>> => {
            try {
                fs.writeFileSync(filePath, content, 'utf-8');
                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message ?? String(err) };
            }
        },
    );

    // ── Terminal: Create ────────────────────────────────────────
    ipcMain.handle(
        IpcChannels.TERMINAL_CREATE,
        async (_event, cwd?: string): Promise<IpcResult<number>> => {
            try {
                const shell = process.platform === 'win32' ? 'powershell.exe' : (process.env.SHELL || 'bash');
                const term = pty.spawn(shell, [], {
                    name: 'xterm-256color',
                    cols: 80,
                    rows: 24,
                    cwd: cwd || process.env.HOME || process.cwd(),
                    env: process.env as Record<string, string>,
                });

                const pid = term.pid;
                terminals.set(pid, term);

                const win = getWindow();
                term.onData((data: string) => {
                    win?.webContents.send(IpcChannels.TERMINAL_DATA, pid, data);
                });
                term.onExit(({ exitCode }) => {
                    terminals.delete(pid);
                    win?.webContents.send(IpcChannels.TERMINAL_EXIT, pid, exitCode);
                });

                return { success: true, data: pid };
            } catch (err: any) {
                return { success: false, error: err.message ?? String(err) };
            }
        },
    );

    // ── Terminal: Write ─────────────────────────────────────────
    ipcMain.on(IpcChannels.TERMINAL_WRITE, (_event, pid: number, data: string) => {
        const term = terminals.get(pid);
        if (term) term.write(data);
    });

    // ── Terminal: Resize ────────────────────────────────────────
    ipcMain.on(IpcChannels.TERMINAL_RESIZE, (_event, pid: number, cols: number, rows: number) => {
        const term = terminals.get(pid);
        if (term) term.resize(cols, rows);
    });

    // ── Terminal: Dispose ───────────────────────────────────────
    ipcMain.on(IpcChannels.TERMINAL_DISPOSE, (_event, pid: number) => {
        const term = terminals.get(pid);
        if (term) {
            term.kill();
            terminals.delete(pid);
        }
    });

    // ── Runner: Execute ─────────────────────────────────────────
    ipcMain.handle(
        IpcChannels.RUNNER_EXECUTE,
        async (_event, cmd: string, cwd?: string): Promise<IpcResult<number>> => {
            try {
                const isWin = process.platform === 'win32';
                const shell = isWin ? 'powershell.exe' : '/bin/sh';
                const args = isWin ? ['-NoProfile', '-Command', cmd] : ['-c', cmd];

                const child = spawn(shell, args, {
                    cwd: cwd || process.cwd(),
                    env: process.env as Record<string, string>,
                });

                const pid = child.pid!;
                runners.set(pid, child);

                const win = getWindow();
                child.stdout?.on('data', (data: Buffer) => {
                    win?.webContents.send(IpcChannels.RUNNER_DATA, pid, data.toString());
                });
                child.stderr?.on('data', (data: Buffer) => {
                    win?.webContents.send(IpcChannels.RUNNER_DATA, pid, data.toString());
                });
                child.on('exit', (code) => {
                    runners.delete(pid);
                    win?.webContents.send(IpcChannels.RUNNER_EXIT, pid, code ?? 0);
                });

                return { success: true, data: pid };
            } catch (err: any) {
                return { success: false, error: err.message ?? String(err) };
            }
        },
    );

    // ── Runner: Kill ────────────────────────────────────────────
    ipcMain.on(IpcChannels.RUNNER_KILL, (_event, pid: number) => {
        const child = runners.get(pid);
        if (child) {
            child.kill();
            runners.delete(pid);
        }
    });
}

// ── Helpers ──────────────────────────────────────────────────────

function readDirectorySync(dirPath: string, depth = 0): FileEntry[] {
    if (depth > 10) return [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const result: FileEntry[] = [];

    for (const entry of entries) {
        if (IGNORE_PATTERNS.has(entry.name)) continue;
        if (entry.name.startsWith('.') && entry.name !== '.env') continue;

        const fullPath = path.join(dirPath, entry.name);
        const fileEntry: FileEntry = {
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
        };

        if (entry.isDirectory()) {
            fileEntry.children = readDirectorySync(fullPath, depth + 1);
        }
        result.push(fileEntry);
    }

    result.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return result;
}
