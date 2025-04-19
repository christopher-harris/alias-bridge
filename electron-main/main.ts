import {app, BrowserWindow} from 'electron';
import {registerAllIpcHandlers} from './src/ipc-handlers';
import {ensureMainWindow, showMainWindow, getMainWindow} from './src/window-manager';
import {readAliasData} from './src/data-store'; // For initial generation
import {regenerateAliasShellFile} from './src/shell-generator'; // For initial generation
import {PLATFORM} from './src/config';
import {watchSystemAppearance} from "./src/settings-manager";
import {createTray, destroyTray} from "./src/tray-manager";
import {closeViewerWindow} from "./src/viewer-window-manager";
import {initAutoUpdater} from './src/update-manager';
import {initBackgroundSync, stopBackgroundSync} from "./src/background-sync/alias-sync-manager";
import Store from "electron-store";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

/**
 * Performs initial setup tasks when the app is ready.
 */
async function initializeApp(): Promise<void> {
    const store = new Store();
    const savedUser = store.get('user');
    console.log('Main savedUser: ', savedUser);
    console.log('App is ready, initializing...');

    if (savedUser) {
        await initBackgroundSync();
    }

    // Perform setup tasks first
    try {
        console.log('Regenerating shell file on startup...');
        const initialAliases = await readAliasData();
        // const aliases = Object.values(initialAliases.aliases);
        await regenerateAliasShellFile(initialAliases);
    } catch (error) {
        console.error('Failed to regenerate shell file on startup:', error);
    }

    // Register all IPC handlers
    registerAllIpcHandlers();

    // --- Create Tray Icon ---
    createTray(); // Tray should usually be created before the window might be shown

    // --- Log the environment variable ---
    console.log(`[ENV CHECK] ELECTRON_UPDATER_FORCE_DEV = ${process.env.ELECTRON_UPDATER_FORCE_DEV}`);

    // --- Ensure Main Window Exists and Get Reference ---
    // Calls ensureMainWindow() which returns the instance (creating if needed)
    const mainWindow = ensureMainWindow(); // <-- Use the function from window-manager

    // --- Start watching system theme changes, passing the correct window instance ---
    watchSystemAppearance(mainWindow); // <-- Pass the mainWindow variable here

    // --- Initialize Auto Updater ---
    initAutoUpdater(mainWindow);

    // --- Optionally show the main window on initial launch ---
    // If you want the main window to appear immediately when the app starts:
    showMainWindow();
    // If you want it to ONLY be opened via Tray or Dock icon, comment out/remove showMainWindow() here.
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
    // Keep this logic - show main window on dock click
    console.log('App activate event triggered.');
    showMainWindow();
});

// --- Handle Quit ---
app.on('before-quit', () => {
    // This fires when app.quit() is called or user quits via Cmd+Q etc.
    // Perform cleanup here BEFORE windows start closing.
    console.log('Before quit event triggered. Cleaning up.');
    destroyTray(); // Clean up tray icon FIRST
    closeViewerWindow(); // Ensure viewer window is closed
    // We no longer need to set a flag. Electron will now proceed to
    // close all windows naturally after this event handler finishes.
    // The 'close' event on mainWindow will NOT be prevented now,
    // allowing the window to be destroyed.
});

// The 'quit' event fires after all windows are closed.
app.on('quit', () => {
    stopBackgroundSync();
    console.log("Application has quit.");
});
