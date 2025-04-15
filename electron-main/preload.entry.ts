import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {ActiveAppearance, Alias, AppearanceSetting, PrimeTheme, UpdateStatus} from "./src/types";

console.log('Preload script loaded.');

export type ElectronAPI = {
    sendMessage: (message: string) => void;
    onMessageReply: (callback: (message: string) => void) => void;

    getAliases: () => Promise<Array<{ name: string; command: string; comment?: string }>>; // Match main process return type
    addAlias: (alias: { name: string; command: string; comment?: string }) => void;
    onAddAliasReply: (callback: (result: { success: boolean; name: string; error?: string }) => void) => void;
    getOSPlatform: () => Promise<any>;

    // --- Update takes ID and the full updated Alias object ---
    updateAlias: (id: string, alias: Alias) => void;
    onUpdateAliasReply: (callback: (result: { success: boolean; id: string; name: string; alias: Alias; error?: string }) => void) => void;

    // --- Delete takes ID ---
    deleteAlias: (id: string) => void;
    onDeleteAliasReply: (callback: (result: { success: boolean; id: string; name: string | null; error?: string }) => void) => void;

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

    removeAllListeners: (channel: string) => void;
}

const api: ElectronAPI = {
    sendMessage: (message) => ipcRenderer.send('send-message-to-main', message),
    // Use (_event: IpcRendererEvent, ...) for typed events if needed
    onMessageReply: (callback) => ipcRenderer.on('message-from-main', (_event, value) => callback(value)),
    getAliases: () => ipcRenderer.invoke('get-aliases'),
    addAlias: (alias) => ipcRenderer.send('add-alias', alias),
    onAddAliasReply: (callback) => ipcRenderer.on('add-alias-reply', (_event, result) => callback(result)),
    getOSPlatform: () => ipcRenderer.invoke('get-os-platform'),

    // --- Update Implementation uses ID ---
    updateAlias: (id, alias) => ipcRenderer.send('update-alias', id, alias), // Pass ID first
    onUpdateAliasReply: (callback) => ipcRenderer.on('update-alias-reply', (_event, result) => callback(result)),

    // --- Delete Implementation uses ID ---
    deleteAlias: (id) => ipcRenderer.send('delete-alias', id),
    onDeleteAliasReply: (callback) => ipcRenderer.on('delete-alias-reply', (_event, result) => callback(result)),

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
};

// Expose specific IPC functions to the Angular app (Renderer process)
// Avoid exposing the entire ipcRenderer object for security reasons.
contextBridge.exposeInMainWorld('electronAPI', api);






// --- NEW CODE ---//

// import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
// import {aliasApi, AliasApi, settingsApi, SettingsApi, updateApi, UpdateApi} from "./src/preload-scripts";
// console.log('Preload script loaded.');
//
// export type ElectronAPI = AliasApi & SettingsApi & UpdateApi & {
//     sendMessage: (message: string) => void;
//     onMessageReply: (callback: (message: string) => void) => void;
//     getOSPlatform: () => Promise<any>;
//     removeAllListeners: (channel: string) => void;
// }
//
// const combinedApi: ElectronAPI = {
//     ...aliasApi,
//     ...settingsApi,
//     ...updateApi,
//     sendMessage: (message) => ipcRenderer.send('send-message-to-main', message),
//     onMessageReply: (callback) => ipcRenderer.on('message-from-main', (_event, value) => callback(value)),
//     getOSPlatform: () => ipcRenderer.invoke('get-os-platform'),
//     removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
// };
//
// // Expose specific IPC functions to the Angular app (Renderer process)
// // Avoid exposing the entire ipcRenderer object for security reasons.
// try {
//     console.log('Preload: Exposing electronAPI to main world...');
//     contextBridge.exposeInMainWorld('electronAPI', combinedApi); // Use the correct variable name
//     console.log('Preload: electronAPI exposed successfully.');
// } catch (error) {
//     console.error('Preload Error exposing API:', error);
// }
