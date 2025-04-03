// electron-main/src/window-manager.ts
import { BrowserWindow } from 'electron';
import path from 'path';
import url from 'url';
import { IS_DEV } from './config';

let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
    return mainWindow;
}

export function createWindow(): BrowserWindow {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    // Load the Angular app
    if (IS_DEV) {
        mainWindow.loadURL('http://localhost:4200');
        mainWindow.webContents.openDevTools();
    } else {
        // Adjust path relative to dist-electron/src/window-manager.js
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, '../../../dist/angular-ui/browser/index.html'),
            protocol: 'file:',
            slashes: true,
        }));
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // De-reference the window object
        mainWindow = null;
        // Consider app.quit() here if it's the only window and not on macOS
    });

    return mainWindow;
}
