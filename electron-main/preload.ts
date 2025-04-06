// electron-main/preload.js
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import {Alias} from "./src/types";

console.log('Preload script loaded.');

export interface ElectronAPI {
    sendMessage: (message: string) => void;
    onMessageReply: (callback: (message: string) => void) => void;
    getAliases: () => Promise<Array<{ name: string; command: string; comment?: string }>>; // Match main process return type
    addAlias: (alias: { name: string; command: string; comment?: string }) => void;
    onAddAliasReply: (callback: (result: { success: boolean; name: string; error?: string }) => void) => void;
    removeAllListeners: (channel: string) => void;
    getOSPlatform: () => Promise<any>;

    // --- Update takes ID and the full updated Alias object ---
    updateAlias: (id: string, alias: Alias) => void;
    onUpdateAliasReply: (callback: (result: { success: boolean; id: string; name: string; error?: string }) => void) => void;

    // --- Delete takes ID ---
    deleteAlias: (id: string) => void;
    onDeleteAliasReply: (callback: (result: { success: boolean; id: string; name: string | null; error?: string }) => void) => void;
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

    // --- Update Implementation uses ID ---
    updateAlias: (id, alias) => ipcRenderer.send('update-alias', id, alias), // Pass ID first
    onUpdateAliasReply: (callback) => ipcRenderer.on('update-alias-reply', (_event, result) => callback(result)),

    // --- Delete Implementation uses ID ---
    deleteAlias: (id) => ipcRenderer.send('delete-alias', id),
    onDeleteAliasReply: (callback) => ipcRenderer.on('delete-alias-reply', (_event, result) => callback(result)),
};

// Expose specific IPC functions to the Angular app (Renderer process)
// Avoid exposing the entire ipcRenderer object for security reasons.
contextBridge.exposeInMainWorld('electronAPI', api);
