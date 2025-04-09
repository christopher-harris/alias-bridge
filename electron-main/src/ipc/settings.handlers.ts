import {BrowserWindow, ipcMain, nativeTheme} from "electron";
import {
    getAppearanceSetting,
    getCurrentAppearance,
    getPrimeThemeSetting,
    setAppearanceSetting, setPrimeThemeSetting
} from "../settings-manager";
import {AppearanceSetting, PrimeTheme} from "../types";

export function registerSettingsHandlers(): void {
    console.log('Registering Settings IPC Handlers...');

    // APPEARANCE/SETTINGS HANDLERS
    ipcMain.handle('settings:get-appearance', (): AppearanceSetting => {
        console.log('IPC: Handling settings:get-appearance');
        return getAppearanceSetting();
    });

    ipcMain.handle('settings:set-appearance', (event, appearance: AppearanceSetting) => {
        // Note: Using handle means we could return success/failure, but
        // for simple settings, just performing the action might be enough.
        // Or use ipcMain.on if no return value is needed.
        console.log(`IPC: Handling settings:set-appearance request: ${appearance}`);
        try {
            setAppearanceSetting(appearance);
            // --- IMPORTANT: Notify renderer about the effective appearance change ---
            // We need access to the main window to send the update
            const window = BrowserWindow.fromWebContents(event.sender);
            if (window) {
                const effectiveappearance = getCurrentAppearance();
                console.log(`Notifying renderer of effective appearance change: ${effectiveappearance}`);
                window.webContents.send('appearance-updated', effectiveappearance);
            }
            return {success: true};
        } catch (error: any) {
            console.error("Error in settings:set-appearance:", error);
            return {success: false, error: error.message};
        }
    });

    /**
     * Provides the *current* OS appearance, ignoring user setting
     */
    ipcMain.handle('appearance:get-system-appearance', (): 'light' | 'dark' => {
        return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    });

    /**
     * Provides the appearance that should currently be applied based on setting + system
     */
    ipcMain.handle('appearance:get-current-effective-appearance', (): 'light' | 'dark' => {
        return getCurrentAppearance();
    });

    /**
     * Provides the selected Prime Theme
     */
    ipcMain.handle('theme:get-current-prime-theme', (): PrimeTheme => {
        return getPrimeThemeSetting();
    });

    /**
     * Sets Prime Theme
     */
    ipcMain.handle('theme:set-prime-theme', (event, theme: PrimeTheme): any => {
        try {
            setPrimeThemeSetting(theme);
            const window = BrowserWindow.fromWebContents(event.sender);
            if (window) {
                const theme = getPrimeThemeSetting();
                window.webContents.send('theme:theme-updated', theme);
            }
            return {success: true, theme};
        } catch (error: any) {
            console.error("Error setting theme:", error);
            return {success: false, error: error.message};
        }
    });
}
