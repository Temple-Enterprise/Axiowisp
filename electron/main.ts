import { app, BrowserWindow, Menu, MenuItemConstructorOptions } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc-handlers';
import { IpcChannels } from '../shared/types';
import * as os from 'os';

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        title: 'Axiowisp',
        icon: path.join(__dirname, '..', '..', 'assets', 'icon-bg.png'),
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
                        mainWindow?.webContents.send('menu:openFolder');
                    },
                },
                {
                    label: 'Save',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        mainWindow?.webContents.send('menu:save');
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
                    click: () => mainWindow?.webContents.send('menu:toggleSidebar'),
                },
                {
                    label: 'Toggle Terminal',
                    accelerator: 'CmdOrCtrl+J',
                    click: () => mainWindow?.webContents.send('menu:toggleBottomPanel'),
                },
                {
                    label: 'Toggle Chat',
                    accelerator: 'CmdOrCtrl+Shift+L',
                    click: () => mainWindow?.webContents.send('menu:toggleChat'),
                },
                { type: 'separator' },
                {
                    label: 'Command Palette',
                    accelerator: 'CmdOrCtrl+P',
                    click: () => mainWindow?.webContents.send('menu:commandPalette'),
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

app.whenReady().then(() => {
    registerIpcHandlers();
    createMenu();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
