import {ipcRenderer} from "electron";
import {UpdateStatus} from "../types";

export interface UpdateApi {
    checkForUpdates: () => void;
    installUpdate: () => void;
    onUpdaterStatus: (callback: (status: UpdateStatus) => void) => void;
}

export const updateApi: UpdateApi = {
    checkForUpdates: () => ipcRenderer.send('updater:check'),
    installUpdate: () => ipcRenderer.send('updater:install'),
    onUpdaterStatus: (callback) => ipcRenderer.on('updater:status', (_event, status) => callback(status)),
};
