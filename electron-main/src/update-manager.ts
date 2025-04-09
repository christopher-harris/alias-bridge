// electron-main/src/update-manager.ts
import {app, BrowserWindow, ipcMain} from 'electron';
import {autoUpdater, UpdateInfo, ProgressInfo} from 'electron-updater';
import logger from 'electron-log'; // Optional but highly recommended for debugging

// Configure electron-log (optional)
// Logs will go to standard OS log locations
// macOS: ~/Library/Logs/<YourAppName>/main.log
// Windows: %USERPROFILE%\AppData\Roaming\<YourAppName>\logs\main.log
logger.transports.file.level = 'info';
autoUpdater.logger = logger; // Pipe autoUpdater logs to electron-log

let updateWindow: BrowserWindow | null = null; // Reference to window for sending messages

/**
 * Initializes the auto-updater. Sets up listeners.
 * @param window The main BrowserWindow to send status updates to.
 */
export function initAutoUpdater(window: BrowserWindow | null): void {
    if (!window) {
        logger.error('UpdateManager: Cannot initialize without a window reference.');
        return;
    }
    updateWindow = window;
    logger.info('UpdateManager: Initializing...');

    // --- Event Listeners ---

    autoUpdater.on('checking-for-update', () => {
        logger.info('UpdateManager: Checking for update...');
        sendStatusToWindow('checking', 'Checking for update...');
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
        logger.info('UpdateManager: Update available.', info);
        sendStatusToWindow('available', `Update available (v${info.version}). Downloading...`);
        // Note: Download starts automatically by default after this event unless disabled
    });

    autoUpdater.on('update-not-available', (info: UpdateInfo) => {
        logger.info('UpdateManager: Update not available.', info);
        sendStatusToWindow('not-available', 'You are running the latest version.');
    });

    autoUpdater.on('error', (err) => {
        logger.error('UpdateManager: Error checking/downloading update.', err);
        sendStatusToWindow('error', `Error checking for updates: ${err.message}`);
    });

    autoUpdater.on('download-progress', (progressObj: ProgressInfo) => {
        const percent = Math.round(progressObj.percent);
        logger.info(`UpdateManager: Download progress: ${percent}%`);
        sendStatusToWindow('downloading', `Downloading update: ${percent}%`, percent);
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
        logger.info('UpdateManager: Update downloaded.', info);
        sendStatusToWindow('downloaded', `Update v${info.version} downloaded. Restart to install.`);
        // At this point, you should prompt the user in the UI to restart
    });

    // --- Initial Check (Optional, with delay) ---
    // Consider checking after a delay so it doesn't impact startup
    // Or only check when the user explicitly clicks a button
    setTimeout(() => {
        logger.info('UpdateManager: Triggering initial update check.');
        // autoUpdater.checkForUpdates(); // Just check
        autoUpdater.checkForUpdatesAndNotify(); // Checks and shows OS notification (simpler, less UI control)
        // Choose one of the above or none for manual-only checks
    }, 10 * 1000); // e.g., check 10 seconds after init

}

/**
 * Triggers a manual check for updates.
 */
export function checkForUpdates(): void {
    logger.info('UpdateManager: Manual update check triggered.');
    autoUpdater.checkForUpdatesAndNotify(); // Or use checkForUpdates() for manual handling
}

/**
 * Quits the application and installs the downloaded update.
 */
export function quitAndInstallUpdate(): void {
    logger.info('UpdateManager: Quitting and installing update...');
    autoUpdater.quitAndInstall();
}

/**
 * Helper to send status messages and progress to the renderer process.
 */
function sendStatusToWindow(status: string, message: string, progress?: number): void {
    if (updateWindow && !updateWindow.isDestroyed()) {
        logger.info(`UpdateManager: Sending status to window: ${status} - ${message}`);
        updateWindow.webContents.send('updater:status', {status, message, progress});
    } else {
        logger.warn(`UpdateManager: Cannot send status '${status}', window not available.`);
    }
}
