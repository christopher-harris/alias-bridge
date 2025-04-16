import {Alias, IncomingAliasData} from "../types";
import {ipcRenderer} from "electron";

export interface AliasApi {
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

}

export const aliasApi: AliasApi = {
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

};
