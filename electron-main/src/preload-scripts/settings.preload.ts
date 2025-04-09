import {ActiveAppearance, AppearanceSetting, PrimeTheme} from "../types";
import {ipcRenderer} from "electron";

export interface SettingsApi {
    getAppearanceSetting: () => Promise<AppearanceSetting>;
    setAppearanceSetting: (appearance: AppearanceSetting) => Promise<{success: boolean, error?: string}>;
    getCurrentAppearance: () => Promise<ActiveAppearance>;
    onAppearanceUpdated: (callback: (appearance: ActiveAppearance) => void) => void;
    getPrimeThemeSetting: () => Promise<PrimeTheme>;
    setPrimeThemeSetting: (theme: PrimeTheme) => Promise<{success: boolean, error?: string}>;
}

export const settingsApi: SettingsApi = {
    getAppearanceSetting: () => ipcRenderer.invoke('settings:get-appearance'),
    setAppearanceSetting: (appearance) => ipcRenderer.invoke('settings:set-appearance', appearance),
    getCurrentAppearance: () => ipcRenderer.invoke('appearance:get-current-active'),
    onAppearanceUpdated: (callback) => ipcRenderer.on('appearance-updated', (_event, appearance) => callback(appearance)),
    getPrimeThemeSetting: () => ipcRenderer.invoke('settings:get-prime-theme'),
    setPrimeThemeSetting: (theme) => ipcRenderer.invoke('settings:set-prime-theme', theme),
};
