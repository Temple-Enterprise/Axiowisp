import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import * as pty from 'node-pty';
import { IpcChannels, FileEntry, IpcResult } from '../shared/types';

const IGNORE_PATTERNS = new Set([
    'node_modules', '.git', '.next', '.vite', 'dist', 'dist-electron',
    '__pycache__', '.DS_Store', 'Thumbs.db', '.cache', '.parcel-cache',
    'coverage', '.nyc_output', '.turbo',
]);

const terminals = new Map<number, pty.IPty>();
const runners = new Map<number, ChildProcess>();
let termIdCounter = 1;

export function registerIpcHandlers(): void {
    const getWindow = () => BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];

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

    ipcMain.handle(
        IpcChannels.WRITE_FILE,
        async (_event, filePath: string, content: string): Promise<IpcResult<void>> => {
            try {
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(filePath, content, 'utf-8');
                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message ?? String(err) };
            }
        },
    );

    ipcMain.handle(
        IpcChannels.LIST_FILES,
        async (_event, dirPath: string): Promise<IpcResult<string[]>> => {
            try {
                const files = listFilesRecursive(dirPath);
                return { success: true, data: files };
            } catch (err: any) {
                return { success: false, error: err.message ?? String(err) };
            }
        },
    );

    ipcMain.handle(
        IpcChannels.CREATE_FILE,
        async (_event, filePath: string): Promise<IpcResult<void>> => {
            try {
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFileSync(filePath, '', 'utf-8');
                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message ?? String(err) };
            }
        },
    );

    ipcMain.handle(
        IpcChannels.CREATE_FOLDER,
        async (_event, dirPath: string): Promise<IpcResult<void>> => {
            try {
                fs.mkdirSync(dirPath, { recursive: true });
                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message ?? String(err) };
            }
        },
    );

    ipcMain.handle(
        IpcChannels.RENAME_ENTRY,
        async (_event, oldPath: string, newPath: string): Promise<IpcResult<void>> => {
            try {
                fs.renameSync(oldPath, newPath);
                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message ?? String(err) };
            }
        },
    );

    ipcMain.handle(
        IpcChannels.DELETE_ENTRY,
        async (_event, targetPath: string): Promise<IpcResult<void>> => {
            try {
                fs.rmSync(targetPath, { recursive: true, force: true });
                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message ?? String(err) };
            }
        },
    );

    ipcMain.handle(
        IpcChannels.TERMINAL_CREATE,
        async (_event, cwd?: string): Promise<IpcResult<number>> => {
            try {
                const isWin = process.platform === 'win32';
                const shell = isWin ? 'powershell.exe' : (process.env.SHELL || '/bin/bash');
                const args = isWin ? [] : ['--login'];

                const term = pty.spawn(shell, args, {
                    name: 'xterm-256color',
                    cols: 80,
                    rows: 24,
                    cwd: cwd || process.env.HOME || process.cwd(),
                    env: process.env as Record<string, string>,
                });

                if (!term.pid) {
                    return { success: false, error: 'Failed to spawn pty process' };
                }

                const id = termIdCounter++;
                terminals.set(id, term);

                const win = getWindow();

                term.onData((data: string) => {
                    win?.webContents.send(IpcChannels.TERMINAL_DATA, id, data);
                });

                term.onExit(({ exitCode }) => {
                    terminals.delete(id);
                    win?.webContents.send(IpcChannels.TERMINAL_EXIT, id, exitCode ?? 0);
                });

                return { success: true, data: id };
            } catch (err: any) {
                console.error('Terminal creation error:', err);
                return { success: false, error: err.message ?? String(err) };
            }
        },
    );

    ipcMain.on(IpcChannels.TERMINAL_WRITE, (_event, id: number, data: string) => {
        const term = terminals.get(id);
        if (term) {
            term.write(data);
        }
    });

    ipcMain.on(IpcChannels.TERMINAL_RESIZE, (_event, id: number, cols: number, rows: number) => {
        const term = terminals.get(id);
        if (term) {
            try {
                term.resize(cols, rows);
            } catch (err) {
                console.warn('Terminal resize failed:', err);
            }
        }
    });

    ipcMain.on(IpcChannels.TERMINAL_DISPOSE, (_event, id: number) => {
        const term = terminals.get(id);
        if (term) {
            term.kill();
            terminals.delete(id);
        }
    });

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

    ipcMain.on(IpcChannels.RUNNER_KILL, (_event, pid: number) => {
        const child = runners.get(pid);
        if (child) {
            child.kill();
            runners.delete(pid);
        }
    });

    ipcMain.handle(
        IpcChannels.SEARCH_IN_FILES,
        async (_event, rootPath: string, query: string, caseSensitive: boolean) => {
            try {
                const matches = searchInFilesRecursive(rootPath, query, caseSensitive);
                return { success: true, data: matches };
            } catch (err: any) {
                return { success: false, error: err.message };
            }
        },
    );

    ipcMain.handle(
        IpcChannels.REPLACE_IN_FILE,
        async (_event, filePath: string, search: string, replace: string, caseSensitive: boolean) => {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const flags = caseSensitive ? 'g' : 'gi';
                const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
                const newContent = content.replace(regex, replace);
                const count = (content.match(regex) || []).length;
                fs.writeFileSync(filePath, newContent, 'utf-8');
                return { success: true, data: count };
            } catch (err: any) {
                return { success: false, error: err.message };
            }
        },
    );

    ipcMain.handle(
        IpcChannels.GIT_STATUS,
        async (_event, cwd: string) => {
            try {
                const branch = await gitExec(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']);
                const statusRaw = await gitExec(cwd, ['status', '--porcelain']);
                const files = statusRaw.split('\n').filter(Boolean).map((line) => {
                    const staged = line[0] !== ' ' && line[0] !== '?';
                    const status = line.substring(0, 2).trim();
                    const filePath = line.substring(3);
                    return { path: filePath, status, staged };
                });
                return { success: true, data: { branch: branch.trim(), files } };
            } catch (err: any) {
                return { success: false, error: err.message };
            }
        },
    );

    ipcMain.handle(
        IpcChannels.GIT_STAGE,
        async (_event, cwd: string, filePath: string) => {
            try {
                await gitExec(cwd, ['add', filePath]);
                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message };
            }
        },
    );

    ipcMain.handle(
        IpcChannels.GIT_UNSTAGE,
        async (_event, cwd: string, filePath: string) => {
            try {
                await gitExec(cwd, ['reset', 'HEAD', filePath]);
                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message };
            }
        },
    );

    ipcMain.handle(
        IpcChannels.GIT_COMMIT,
        async (_event, cwd: string, message: string) => {
            try {
                await gitExec(cwd, ['commit', '-m', message]);
                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message };
            }
        },
    );

    ipcMain.handle(
        IpcChannels.GIT_PUSH,
        async (_event, cwd: string) => {
            try {
                await gitExec(cwd, ['push']);
                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message };
            }
        },
    );

    ipcMain.handle(
        IpcChannels.GIT_PULL,
        async (_event, cwd: string) => {
            try {
                await gitExec(cwd, ['pull']);
                return { success: true };
            } catch (err: any) {
                return { success: false, error: err.message };
            }
        },
    );
}

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

function listFilesRecursive(dirPath: string, depth = 0, maxFiles = 500): string[] {
    if (depth > 8) return [];
    const files: string[] = [];

    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            if (files.length >= maxFiles) break;
            if (IGNORE_PATTERNS.has(entry.name)) continue;
            if (entry.name.startsWith('.')) continue;

            const fullPath = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
                files.push(...listFilesRecursive(fullPath, depth + 1, maxFiles - files.length));
            } else {
                files.push(fullPath);
            }
        }
    } catch { }

    return files;
}

function searchInFilesRecursive(rootPath: string, query: string, caseSensitive: boolean, depth = 0): any[] {
    if (depth > 8) return [];
    const matches: any[] = [];
    const BINARY_EXT = new Set(['png', 'jpg', 'jpeg', 'gif', 'ico', 'svg', 'mp4', 'webm', 'exe', 'dll', 'zip', 'woff', 'woff2', 'ttf', 'eot']);

    try {
        const entries = fs.readdirSync(rootPath, { withFileTypes: true });
        for (const entry of entries) {
            if (matches.length >= 200) break;
            if (IGNORE_PATTERNS.has(entry.name)) continue;
            if (entry.name.startsWith('.')) continue;

            const fullPath = path.join(rootPath, entry.name);
            if (entry.isDirectory()) {
                matches.push(...searchInFilesRecursive(fullPath, query, caseSensitive, depth + 1));
            } else {
                const ext = entry.name.split('.').pop()?.toLowerCase() ?? '';
                if (BINARY_EXT.has(ext)) continue;

                try {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const lines = content.split('\n');
                    const q = caseSensitive ? query : query.toLowerCase();

                    for (let i = 0; i < lines.length && matches.length < 200; i++) {
                        const line = lines[i];
                        const searchLine = caseSensitive ? line : line.toLowerCase();
                        let idx = searchLine.indexOf(q);
                        while (idx !== -1 && matches.length < 200) {
                            matches.push({
                                filePath: fullPath,
                                lineNumber: i + 1,
                                lineContent: line.substring(0, 300),
                                matchStart: idx,
                                matchEnd: idx + query.length,
                            });
                            idx = searchLine.indexOf(q, idx + 1);
                        }
                    }
                } catch { }
            }
        }
    } catch { }

    return matches;
}

function gitExec(cwd: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn('git', args, { cwd, env: process.env as Record<string, string> });
        let stdout = '';
        let stderr = '';
        child.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
        child.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });
        child.on('close', (code) => {
            if (code === 0) resolve(stdout);
            else reject(new Error(stderr || `git exited with code ${code}`));
        });
        child.on('error', reject);
    });
}

