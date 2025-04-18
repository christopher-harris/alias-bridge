import { contextBridge, ipcRenderer } from 'electron';
import {ActiveAppearance, Alias, AppearanceSetting, IncomingAliasData, PrimeTheme, UpdateStatus} from "./src/types";

console.log('Preload script loaded.');

export type ElectronAPI = {
    sendMessage: (message: string) => void;
    onMessageReply: (callback: (message: string) => void) => void;

    getAliases: () => Promise<Array<{ name: string; command: string; comment?: string }>>; // Match main process return type

    addAlias: (alias: IncomingAliasData) => void;
    onAddAliasReply: (callback: (result: { success: boolean; name: string; error?: string }) => void) => void;

    // --- Update takes ID and the full updated Alias object ---
    updateAlias: (id: string, alias: Alias) => void;
    onUpdateAliasReply: (callback: (result: { success: boolean; id: string; name: string; alias: Alias; error?: string }) => void) => void;

    // --- Delete takes ID ---
    deleteAlias: (id: string) => void;
    onDeleteAliasReply: (callback: (result: { success: boolean; id: string; name: string | null; error?: string }) => void) => void;

    syncAliasesFromCloud: (aliases: Alias[]) => Promise<{ success: boolean; error?: string }>;

    getOSPlatform: () => Promise<any>;

    // --- Appearance Methods ---
    getAppearanceSetting: () => Promise<AppearanceSetting>;
    setAppearanceSetting: (theme: AppearanceSetting) => Promise<{success: boolean, error?: string}>; // Return success/error status
    getSystemAppearance: () => Promise<ActiveAppearance>;
    getCurrentActiveAppearance: () => Promise<ActiveAppearance>;
    // Listener for when the effective theme changes (due to setting or system change)
    onAppearanceUpdated: (callback: (theme: ActiveAppearance) => void) => void;

    // --- Prime Theme Methods ---
    getPrimeThemeSetting: () => Promise<PrimeTheme>;
    setPrimeThemeSetting: (theme: PrimeTheme) => Promise<{success: boolean, error?: string}>;

    // --- Updater Methods ---
    checkForUpdates: () => void;
    installUpdate: () => void;
    onUpdaterStatus: (callback: (status: UpdateStatus) => void) => void;

    // --- Firebase Auth ---
    authenticateWithGitHub: (userData: { user: any; token: string }) => void;
    onAuthSuccess: (callback: (decodedToken: any) => void) => void;
    onAuthError: (callback: (error: any) => void) => void;
    
    // Add these new methods after the existing Firebase Auth methods
    logOut: () => void;
    onLogOutSuccess: (callback: () => void) => void;

    // --- Tell the UI about the updates ---
    onAliasesUpdated: (callback: (aliases: Alias[]) => void) => void;

    removeAllListeners: (channel: string) => void;
}

const api: ElectronAPI = {
    sendMessage: (message) => ipcRenderer.send('send-message-to-main', message),
    onMessageReply: (callback) => ipcRenderer.on('message-from-main', (_event, value) => callback(value)),

    // alias: ...aliasApi,
    getAliases: () => ipcRenderer.invoke('get-aliases'),

    addAlias: (alias) => ipcRenderer.send('add-alias', alias),
    onAddAliasReply: (callback) => ipcRenderer.on('add-alias-reply', (_event, result) => callback(result)),

    // --- Update Implementation uses ID ---
    updateAlias: (id, alias) => ipcRenderer.send('update-alias', id, alias), // Pass ID first
    onUpdateAliasReply: (callback) => ipcRenderer.on('update-alias-reply', (_event, result) => callback(result)),

    // --- Delete Implementation uses ID ---
    deleteAlias: (id) => ipcRenderer.send('delete-alias', id),
    onDeleteAliasReply: (callback) => ipcRenderer.on('delete-alias-reply', (_event, result) => callback(result)),

    syncAliasesFromCloud: (aliases) => {
        if (!aliases || !Array.isArray(aliases)) {
            console.error('Invalid aliases data:', aliases);
            return Promise.resolve({ success: false, error: 'Invalid aliases data' });
        }
        return ipcRenderer.invoke('sync-aliases-from-cloud', aliases);
    },
    getOSPlatform: () => ipcRenderer.invoke('get-os-platform'),

    // --- Appearance Implementation ---
    getAppearanceSetting: () => ipcRenderer.invoke('settings:get-appearance'),
    setAppearanceSetting: (appearance) => ipcRenderer.invoke('settings:set-appearance', appearance),
    getSystemAppearance: () => ipcRenderer.invoke('appearance:get-system-appearance'),
    getCurrentActiveAppearance: () => ipcRenderer.invoke('appearance:get-current-effective-appearance'),
    onAppearanceUpdated: (callback) => ipcRenderer.on('appearance-updated', (_event, appearance) => callback(appearance)),

    // --- Prime Theme Implementation ---
    getPrimeThemeSetting: () => ipcRenderer.invoke('settings:get-current-prime-theme'),
    setPrimeThemeSetting: (theme) => ipcRenderer.invoke('settings:set-prime-theme', theme),

    // --- Updater Implementation ---
    checkForUpdates: () => ipcRenderer.send('updater:check'),
    installUpdate: () => ipcRenderer.send('updater:install'),
    onUpdaterStatus: (callback) => ipcRenderer.on('updater:status', (_event, status) => callback(status)),

    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

    authenticateWithGitHub: (userData) => {
        ipcRenderer.send('firebase-github-auth', userData);
    },

    onAuthSuccess: (callback) => {
        ipcRenderer.on('firebase-github-auth-success', (_event, decodedToken) => callback(decodedToken));
    },

    onAuthError: (callback) => {
        ipcRenderer.on('firebase-github-auth-error', (_event, error) => callback(error));
    },

    onAliasesUpdated: (callback) =>
        ipcRenderer.on('aliases-updated', (_event, aliases: Alias[]) => callback(aliases)),
        
    logOut: () => ipcRenderer.send('firebase-logout'),
    onLogOutSuccess: (callback) => ipcRenderer.on('firebase-logout-success', () => callback()),

};

// Expose specific IPC functions to the Angular app (Renderer process)
// Avoid exposing the entire ipcRenderer object for security reasons.
contextBridge.exposeInMainWorld('electronAPI', api);
