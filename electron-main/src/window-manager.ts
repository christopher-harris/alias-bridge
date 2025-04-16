import { BrowserWindow, app, Event } from 'electron'; // Added Event type
import path from 'path';
import url from 'url';
import { IS_DEV } from './config';
import installExtension, {REDUX_DEVTOOLS} from "electron-devtools-installer"; // Use IS_DEV from config

// Module-level variable to hold the main window instance
let mainWindow: BrowserWindow | null = null;

/**
 * Returns the current mainWindow instance if it exists and is not destroyed.
 * @returns {BrowserWindow | null} The main window instance or null.
 */
export function getMainWindow(): BrowserWindow | null {
    if (mainWindow && !mainWindow.isDestroyed()) {
        return mainWindow;
    }
    return null;
}

/**
 * Ensures the main window exists (creates if not) and returns it.
 * @returns {BrowserWindow} The main application window instance.
 */
export function ensureMainWindow(): BrowserWindow {
    // Check if the window exists and hasn't been destroyed
    if (!mainWindow || mainWindow.isDestroyed()) {
        console.log('Main window doesn\'t exist or is destroyed, creating...');
        // Create a new window using the internal function
        mainWindow = createWindowInternal();
    }
    // Return the valid instance
    return mainWindow;
}

/**
 * Ensures the main window exists, shows it, and focuses it.
 */
export function showMainWindow(): void {
    const win = ensureMainWindow(); // Get or create the window
    // If the window truly exists (ensureMainWindow should guarantee this)
    if (win) {
        console.log('Showing main window...');
        if (win.isMinimized()) {
            win.restore(); // Restore if minimized
        }
        win.show(); // Show if hidden
        win.focus(); // Bring to front
    } else {
        console.error("Failed to show main window - ensureMainWindow didn't return an instance.");
    }
}

/**
 * Internal function to configure and create the main BrowserWindow instance.
 * Do not call this directly from outside; use ensureMainWindow() or showMainWindow().
 * @returns {BrowserWindow} The newly created BrowserWindow instance.
 */
function createWindowInternal(): BrowserWindow {
    console.log('Creating new main window instance...');
    const preloadPath = path.join(__dirname, '../preload.entry.js'); // Calculate path
    console.log(`--- WindowManager: Attempting to use preload script at: ${preloadPath} ---`); // Log the path
    const newWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            preload: preloadPath, // Relative to dist-electron/src
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
        show: false, // Create hidden initially; use showMainWindow() to display
        frame: true, // Keep standard frame unless specifically making frameless
        // titleBarStyle: 'default', // Keep default unless using hidden etc. on Mac
    });

    // Remove default menu (optional, can be handled by Menu.setApplicationMenu in main.ts)
    // newWindow.setMenu(null);

    // --- Load the Angular application (main route) ---
    if (IS_DEV) {
        console.log('Loading main window URL (Dev): http://localhost:4200');
        newWindow.loadURL('http://localhost:4200'); // Assumes main app is at root route
        newWindow.webContents.openDevTools(); // Open DevTools in dev
        installExtension(REDUX_DEVTOOLS);
    } else {
        const appRootPath = app.getAppPath();
        const indexPath = path.join(appRootPath, 'dist/alias-bridge-ui/browser/index.html');
        console.log('Loading main window file (Prod):', indexPath);
        // Load the root index.html (Angular router handles showing the correct component)
        newWindow.loadFile(indexPath).catch(err => {
            console.error('ERROR loading main window file:', indexPath, err);
        });
    }

    // --- Modified Close Handler for Tray Icon Behavior ---
    // Prevents app from quitting when window is closed, hides instead.
    newWindow.on('close', (event: Event) => {
        if (!(global as any).isQuitting) {
            console.log('Main window "close" event intercepted, hiding window.');
            event.preventDefault(); // Prevent the window from actually closing
            newWindow.hide(); // Hide the window instead
            newWindow.close();
            if (process.platform === 'darwin') {
                // Optional: Hide dock icon when window hides on macOS
                // app.dock?.hide();
            }
        } else {
            console.log('Main window close allowed (app quitting).');
            // Allow default behavior (window closes)
        }
    });

    newWindow.on('closed', () => {
        // This will now ONLY fire when the app is truly quitting
        // and the window destruction is allowed to proceed.
        console.log('Main window "closed" event fired.');
        if (mainWindow === newWindow) { // Check if it's the same instance we track
            mainWindow = null;
        }
    });

    return newWindow;
} // End of createWindowInternal
