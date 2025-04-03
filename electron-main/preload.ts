// electron-main/preload.js
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

console.log('Preload script loaded.');

export interface ElectronAPI {
    sendMessage: (message: string) => void;
    onMessageReply: (callback: (message: string) => void) => void;
    getAliases: () => Promise<Array<{ name: string; command: string; comment?: string }>>; // Match main process return type
    addAlias: (alias: { name: string; command: string; comment?: string }) => void;
    onAddAliasReply: (callback: (result: { success: boolean; name: string; error?: string }) => void) => void;
    removeAllListeners: (channel: string) => void;
    getOSPlatform: () => Promise<any>;
}

const api: ElectronAPI = {
    sendMessage: (message) => ipcRenderer.send('send-message-to-main', message),
    // Use (_event: IpcRendererEvent, ...) for typed events if needed
    onMessageReply: (callback) => ipcRenderer.on('message-from-main', (_event, value) => callback(value)),
    getAliases: () => ipcRenderer.invoke('get-aliases'),
    addAlias: (alias) => ipcRenderer.send('add-alias', alias),
    onAddAliasReply: (callback) => ipcRenderer.on('add-alias-reply', (_event, result) => callback(result)),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
    getOSPlatform: () => ipcRenderer.invoke('get-os-platform'),
};

// Expose specific IPC functions to the Angular app (Renderer process)
// Avoid exposing the entire ipcRenderer object for security reasons.
contextBridge.exposeInMainWorld('electronAPI', api);
