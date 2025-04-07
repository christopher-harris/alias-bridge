// electron-main/src/window-manager.ts
import { BrowserWindow, app } from 'electron';
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
        frame: false,
    });

    // Force open DevTools even in production FOR DEBUGGING ONLY
    // REMOVE THIS BEFORE ACTUAL RELEASE
    // mainWindow.webContents.openDevTools({ mode: 'detach' }); // Open detached

    // Load the Angular app
    if (IS_DEV) {
        mainWindow.loadURL('http://localhost:4200');
        mainWindow.webContents.openDevTools();
    } else {
        // --- Use app.getAppPath() for production ---
        const appRootPath = app.getAppPath(); // Path to app.asar or app/
        // Path to index.html relative to the app root
        const indexPath = path.join(appRootPath, 'dist/alias-bridge-ui/browser/index.html');
        const indexUrl = url.format({
            pathname: indexPath,
            protocol: 'file:',
            slashes: true,
        });

        console.log('[AliasBridge Production Load]');
        console.log('  __dirname:', __dirname); // Where the JS file is (inside asar)
        console.log('  app.getAppPath():', appRootPath); // Where the app root (asar) is
        console.log('  Calculated Index Path:', indexPath); // The path we build relative to app root
        console.log('  Formatted URL:', indexUrl); // The final URL

        mainWindow.loadFile(indexPath).catch(err => {
            console.error('ERROR loading URL:', indexPath, err);
            // Consider showing an error dialog to the user here
        });
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // De-reference the window object
        mainWindow = null;
        // Consider app.quit() here if it's the only window and not on macOS
    });

    return mainWindow;
}
