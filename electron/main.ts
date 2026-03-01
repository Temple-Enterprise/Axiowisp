import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc-handlers';
import { IpcChannels } from '../shared/types';
import * as os from 'os';

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
    const iconPath = isDev
        ? path.join(__dirname, '..', '..', 'public', 'icon-bg.png')
        : path.join(__dirname, '..', '..', 'dist', 'icon-bg.png');

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        title: 'Axiowisp',
        icon: iconPath,
        backgroundColor: '#0d1117',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });

    // Graceful show once ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createMenu(): void {
    const isMac = process.platform === 'darwin';

    const template: MenuItemConstructorOptions[] = [
        ...(isMac
            ? [{ role: 'appMenu' as const }]
            : []),
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open Folder…',
                    accelerator: 'CmdOrCtrl+Shift+O',
                    click: () => {
                        mainWindow?.webContents.send(IpcChannels.MENU_OPEN_FOLDER);
                    },
                },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow?.webContents.send(IpcChannels.MENU_SAVE);
                    },
                },
                { type: 'separator' },
                isMac ? { role: 'close' as const } : { role: 'quit' as const },
            ],
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' },
            ],
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Toggle Sidebar',
                    accelerator: 'CmdOrCtrl+B',
                    click: () => mainWindow?.webContents.send(IpcChannels.MENU_TOGGLE_SIDEBAR),
                },
                {
                    label: 'Toggle Terminal',
                    accelerator: 'CmdOrCtrl+J',
                    click: () => mainWindow?.webContents.send(IpcChannels.MENU_TOGGLE_BOTTOM_PANEL),
                },
                {
                    label: 'Toggle Chat',
                    accelerator: 'CmdOrCtrl+Shift+L',
                    click: () => mainWindow?.webContents.send(IpcChannels.MENU_TOGGLE_CHAT),
                },
                { type: 'separator' },
                {
                    label: 'Command Palette',
                    accelerator: 'CmdOrCtrl+P',
                    click: () => mainWindow?.webContents.send(IpcChannels.MENU_COMMAND_PALETTE),
                },
                { type: 'separator' },
                { role: 'toggleDevTools' },
                { role: 'reload' },
            ],
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Welcome',
                    click: () => mainWindow?.webContents.send(IpcChannels.MENU_WELCOME),
                },
                { type: 'separator' },
                {
                    label: 'About Axiowisp',
                    click: () => {
                        mainWindow?.webContents.send(IpcChannels.MENU_ABOUT, {
                            appVersion: app.getVersion(),
                            electronVersion: process.versions.electron,
                            chromeVersion: process.versions.chrome,
                            nodeVersion: process.versions.node,
                            v8Version: process.versions.v8,
                            osType: os.type(),
                            osRelease: os.release(),
                            arch: os.arch(),
                        });
                    },
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

function registerProtocols(): void {
    const { protocol, net } = require('electron');
    const { pathToFileURL } = require('url');
    protocol.handle('axiowisp', (request: Request) => {
        try {
            const urlObj = new URL(request.url);
            const filePath = urlObj.searchParams.get('path');
            if (filePath) {
                return net.fetch(pathToFileURL(filePath).toString());
            }
        } catch (err) {
            console.error('Protocol handle error:', err);
        }
        return new Response('Not Found', { status: 404 });
    });
}

/** Extract file path from argv (for "Open With" / drag-to-app / CLI). */
function getFileFromArgs(argv: string[]): string | null {
    // Skip electron binary and app path, look for a real file path
    for (let i = 1; i < argv.length; i++) {
        const arg = argv[i];
        if (arg && !arg.startsWith('-') && !arg.startsWith('--') && path.isAbsolute(arg)) {
            try {
                const fs = require('fs');
                if (fs.existsSync(arg) && fs.statSync(arg).isFile()) {
                    return arg;
                }
            } catch { /* ignore */ }
        }
    }
    return null;
}

/** Send a file path to the renderer to open in a tab. */
function openFileInRenderer(filePath: string): void {
    if (mainWindow) {
        mainWindow.webContents.send('open-file', filePath);
    }
}

// Only one instance — if user double-clicks another file, focus existing window
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
} else {
    app.on('second-instance', (_event, argv) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
            const fileToOpen = getFileFromArgs(argv);
            if (fileToOpen) openFileInRenderer(fileToOpen);
        }
    });

    app.whenReady().then(() => {
        registerProtocols();
        registerIpcHandlers();
        createMenu();
        createWindow();

        // Check if launched with a file argument
        const fileToOpen = getFileFromArgs(process.argv);
        if (fileToOpen && mainWindow) {
            mainWindow.once('ready-to-show', () => {
                openFileInRenderer(fileToOpen);
            });
        }
    });
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
