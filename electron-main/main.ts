import { app, BrowserWindow } from 'electron';
import { registerIpcHandlers } from './src/ipc-handlers';
import { createWindow, getMainWindow } from './src/window-manager';
import { readAliasData } from './src/data-store'; // For initial generation
import { regenerateAliasShellFile } from './src/shell-generator'; // For initial generation
import { PLATFORM } from './src/config'; // Use platform constant

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

/**
 * Performs initial setup tasks when the app is ready.
 */
async function initializeApp(): Promise<void> {
    console.log('App is ready, initializing...');
    // Ensure shell file is consistent on startup
    try {
        console.log('Regenerating shell file on startup...');
        const initialAliases = await readAliasData();
        await regenerateAliasShellFile(initialAliases);
    } catch (error) {
        console.error('Failed to regenerate shell file on startup:', error);
        // TODO: Maybe show an error dialog to the user?
    }

    // Register all IPC handlers
    registerIpcHandlers();

    // Create the main application window
    createWindow();
}

// --- App Lifecycle ---

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(initializeApp);

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
    if (PLATFORM !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
    // You could also focus the existing window if it's minimized
    // const mainWindow = getMainWindow();
    // if (mainWindow) {
    //     if (mainWindow.isMinimized()) mainWindow.restore();
    //     mainWindow.focus();
    // }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
