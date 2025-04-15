// electron-main/src/viewer-window-manager.ts
import { BrowserWindow, screen, Tray, app } from 'electron';
import path from 'path';
import url from 'url';
import { IS_DEV } from './config'; // Assuming you have IS_DEV in config.ts
// No direct dependency on Alias type needed here usually

// Module-level variable to hold the viewer window instance
let viewerWindow: BrowserWindow | null = null;

// Define constants for the viewer window size
const WINDOW_WIDTH = 1024;
const WINDOW_HEIGHT = 768;

/**
 * Calculates the position for the viewer window near the tray icon.
 * @param tray The Tray instance to position near.
 * @returns { x: number; y: number } The calculated screen coordinates.
 */
function calculateWindowPosition(tray: Tray | null): { x: number; y: number } {
    const defaultPosition = { x: 0, y: 0 }; // Fallback position
    if (!tray) {
        console.warn("Cannot calculate position without tray reference.");
        const primaryDisplay = screen.getPrimaryDisplay();
        // Center horizontally, position near top vertically as a fallback
        defaultPosition.x = Math.round(primaryDisplay.workArea.x + (primaryDisplay.workAreaSize.width / 2) - (WINDOW_WIDTH / 2));
        defaultPosition.y = primaryDisplay.workArea.y + 50;
        return defaultPosition;
    }

    try {
        const trayBounds = tray.getBounds();
        const primaryDisplay = screen.getPrimaryDisplay();
        const { workArea } = primaryDisplay; // Use workArea for positioning

        let x: number, y: number;

        // Calculate initial position based on tray icon center
        x = Math.round(trayBounds.x + (trayBounds.width / 2) - (WINDOW_WIDTH / 2));

        // Determine vertical position based on OS and assumed taskbar/menubar position
        if (process.platform === 'darwin') {
            // macOS: Position window below the menu bar icon
            y = Math.round(trayBounds.y + trayBounds.height + 3); // Small margin below tray
        } else { // Windows/Linux (assuming taskbar is often at the bottom)
            // Position window above the tray icon
            y = Math.round(trayBounds.y - WINDOW_HEIGHT - 3); // Small margin above tray

            // If calculated position is off-screen (e.g., taskbar on top/side), adjust
            if (y < workArea.y) {
                // Taskbar might be at the top, position below tray instead
                y = Math.round(trayBounds.y + trayBounds.height + 3);
            }
        }

        // --- Screen Boundary Adjustments ---

        // Keep window fully within horizontal work area bounds
        if (x < workArea.x) {
            x = workArea.x;
        } else if (x + WINDOW_WIDTH > workArea.x + workArea.width) {
            x = workArea.x + workArea.width - WINDOW_WIDTH;
        }

        // Keep window fully within vertical work area bounds
        if (y < workArea.y) {
            y = workArea.y;
        } else if (y + WINDOW_HEIGHT > workArea.y + workArea.height) {
            y = workArea.y + workArea.height - WINDOW_HEIGHT;
        }


        return { x, y };

    } catch (error) {
        console.error("Error calculating viewer window position:", error);
        // Fallback to screen center if calculation fails badly
        const primaryDisplay = screen.getPrimaryDisplay();
        defaultPosition.x = Math.round(primaryDisplay.workArea.x + (primaryDisplay.workAreaSize.width / 2) - (WINDOW_WIDTH / 2));
        defaultPosition.y = Math.round(primaryDisplay.workArea.y + (primaryDisplay.workAreaSize.height / 2) - (WINDOW_HEIGHT / 2));
        return defaultPosition;
    }
}

/**
 * Creates and configures the viewer BrowserWindow instance.
 * Does not show the window initially.
 * @param tray The Tray instance, used for positioning.
 * @returns {BrowserWindow} The created viewer window.
 */
function createViewerWindowInternal(tray: Tray | null): BrowserWindow {
    console.log('Creating viewer window instance...');
    const newViewerWindow = new BrowserWindow({
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        show: false, // Start hidden
        frame: false, // No OS window frame
        fullscreenable: false,
        resizable: false,
        alwaysOnTop: true, // Keep viewer on top initially
        skipTaskbar: true, // Don't show in taskbar/dock
        movable: false, // Usually not needed if positioned correctly
        transparent: false, // Often better perf than true unless needed for design
        webPreferences: {
            // Use the same preload-scripts as the main window, or a dedicated one if needed
            preload: path.join(__dirname, '../preload-scripts.entry.js'), // Relative to dist-electron/src
            contextIsolation: true,
            nodeIntegration: false,
        },
        // On macOS, prevent it from becoming the main window type
        type: (process.platform === 'darwin') ? 'panel' : undefined,
    });

    // --- Load Viewer UI ---
    // Define the specific route in your Angular app for the viewer component
    const viewerRoute = '/viewer';
    if (IS_DEV) {
        // Use hash routing during development with localhost server
        const devUrl = `http://localhost:4200/#${viewerRoute}`;
        console.log(`Loading viewer URL (Dev): ${devUrl}`);
        newViewerWindow.loadURL(devUrl);
        // Optionally open DevTools for the viewer window
        // newViewerWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        const appRootPath = app.getAppPath();
        const indexPath = path.join(appRootPath, 'dist/alias-bridge-ui/browser/index.html');
        console.log(`Loading viewer file (Prod): ${indexPath}, hash: ${viewerRoute}`);
        // Use loadFile with hash routing for production build
        newViewerWindow.loadFile(indexPath, { hash: viewerRoute }).catch(err => {
            console.error('ERROR loading viewer file:', indexPath, err);
        });
    }

    // --- Auto-close on Blur ---
    // Hide the window when it loses focus
    newViewerWindow.on('blur', () => {
        if (newViewerWindow && !newViewerWindow.isDestroyed() && !newViewerWindow.webContents.isDevToolsFocused()) {
            console.log('Viewer window lost focus, hiding.');
            newViewerWindow.hide();
        }
    });

    // --- Cleanup on Close ---
    newViewerWindow.on('closed', () => {
        console.log('Viewer window closed event.');
        if (viewerWindow === newViewerWindow) {
            viewerWindow = null; // Clear the reference
        }
    });

    return newViewerWindow;
} // End of createViewerWindowInternal

/**
 * Toggles the visibility of the viewer window. Creates it if it doesn't exist.
 * @param tray The Tray instance used for positioning.
 */
export function toggleViewerWindow(tray: Tray | null): void {
    // Ensure window exists, create if needed
    if (!viewerWindow || viewerWindow.isDestroyed()) {
        console.log('Viewer window doesn\'t exist or is destroyed, creating...');
        viewerWindow = createViewerWindowInternal(tray);
    }

    // If window exists (it should now), toggle visibility
    if (viewerWindow) {
        if (viewerWindow.isVisible()) {
            console.log('Viewer window is visible, hiding.');
            viewerWindow.hide();
        } else {
            console.log('Viewer window is hidden, calculating position and showing.');
            const position = calculateWindowPosition(tray);
            console.log('Setting viewer window position:', position);
            // Set position BEFORE showing to avoid flicker
            viewerWindow.setPosition(position.x, position.y, false); // false = no animation
            viewerWindow.show();
            viewerWindow.focus(); // Bring window to front
        }
    } else {
        console.error("Failed to toggle viewer window - instance is still null after creation attempt.");
    }
}

/**
 * Closes the viewer window instance if it exists.
 * Called during application quit sequence.
 */
export function closeViewerWindow(): void {
    if (viewerWindow && !viewerWindow.isDestroyed()) {
        console.log('Closing viewer window during app quit.');
        viewerWindow.close(); // Allows the 'closed' event to fire for cleanup
    }
    viewerWindow = null; // Clear reference immediately as well
}
