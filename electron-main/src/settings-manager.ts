// electron-main/src/settings-manager.ts
import Store from 'electron-store';
import { nativeTheme } from 'electron';
import {PrimeTheme} from "./types"; // To get system theme info

// Define the structure of your settings
interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    primeTheme: PrimeTheme;
}

// Define default settings
const defaults: AppSettings = {
    theme: 'system',
    primeTheme: 'aura'
};

// Initialize the store
// The 'settings' name will create a settings.json file in the app's userData folder
const store = new Store<AppSettings>({ defaults });

console.log('Settings store initialized at:', (store as any).path);

// --- Functions to Manage Settings ---

export function getAppearanceSetting(): AppSettings['theme'] {
    try {
        // Ensure the stored value is one of the allowed types, fallback otherwise
        const storedTheme = (store as any).get('theme');
        if (['light', 'dark', 'system'].includes(storedTheme)) {
            return storedTheme;
        }
        console.warn(`Invalid theme value '${storedTheme}' found in store, falling back to default.`);
        setAppearanceSetting(defaults.theme); // Reset to default if invalid
        return defaults.theme;
    } catch (error) {
        console.error("Error reading theme setting, returning default:", error);
        return defaults.theme;
    }
}

export function setAppearanceSetting(theme: AppSettings['theme']): void {
    try {
        if (['light', 'dark', 'system'].includes(theme)) {
            (store as any).set('theme', theme);
            console.log(`Theme setting saved: ${theme}`);
        } else {
            console.warn(`Attempted to save invalid theme value: ${theme}`);
        }
    } catch (error) {
        console.error("Error saving theme setting:", error);
    }
}

/**
 * Resolves the actual theme ('light' or 'dark') based on the setting
 * and the current system theme.
 */
export function getCurrentAppearance(): 'light' | 'dark' {
    const setting = getAppearanceSetting();
    if (setting === 'system') {
        // nativeTheme.shouldUseDarkColors checks the OS setting
        return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    }
    return setting; // 'light' or 'dark'
}

/**
 * Watches for system theme changes and notifies the renderer.
 * @param mainWindow The BrowserWindow instance to send messages to.
 */
export function watchSystemAppearance(mainWindow: Electron.BrowserWindow | null): void {
    nativeTheme.on('updated', () => {
        console.log('Native theme updated.');
        const currentTheme = getCurrentAppearance();
        console.log(`System theme changed, resolved effective theme: ${currentTheme}`);
        // Notify the renderer process about the effective theme change
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('theme-updated', currentTheme);
        }
    });
}

export function getPrimeThemeSetting(): PrimeTheme {
    try {
        const stored = (store as any).get('primeTheme');
        // Add validation if needed based on allowed PrimeTheme types
        if (['aura', 'lara', 'nora', 'material'].includes(stored)) { // Example validation
            return stored;
        }
        console.warn(`Invalid primeTheme value '${stored}' found, falling back to default.`);
        setPrimeThemeSetting(defaults.primeTheme); // Reset if invalid
        return defaults.primeTheme;
    } catch (error) {
        console.error("Error reading primeTheme setting:", error);
        return defaults.primeTheme;
    }
}

export function setPrimeThemeSetting(themeName: PrimeTheme): void {
    try {
        if (['aura', 'lara', 'nora', 'material'].includes(themeName)) { // Example validation
            (store as any).set('primeTheme', themeName);
            console.log(`Prime theme setting saved: ${themeName}`);
        } else {
            console.warn(`Attempted to save invalid primeTheme value: ${themeName}`);
        }
    } catch (error) {
        console.error("Error saving primeTheme setting:", error);
    }
}
