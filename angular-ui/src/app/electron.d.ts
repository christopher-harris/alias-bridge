import {AliasData, DeletedAlias} from '../../../electron-main/src/types';

interface Alias {
  id: string;
  name: string;
  command: string;
  comment?: string;
  created?: Date;
  lastUpdated?: Date;
}

export interface AliasData {
  aliases: Record<string, Alias>;
  deleted: Record<string, DeletedAlias>;
  updatedAt: number;
  updatedBy: string;
}

export type NewAlias = Omit<Alias, 'id'>;

export type AppearanceSetting = 'light' | 'dark' | 'system';
export type ActiveAppearance = 'light' | 'dark';
export type PrimeTheme = 'aura' | 'lara' | 'nora' | 'material';

export interface UpdateStatus {
  status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
  message: string;
  progress?: number;
}

// Declare the interface matching the preload-scripts script's exposed API
export interface IElectronAPI {
  sendMessage: (message: string) => void;
  onMessageReply: (callback: (message: string) => void) => void;

  getAliases: () => Promise<Alias[]>; // Updated to return AliasData

  addAlias: (alias: NewAlias) => void;
  onAddAliasReply: (callback: (result: { success: boolean; name: string; error?: string }) => void) => void;

  updateAlias: (id: string, alias: Alias) => void;
  onUpdateAliasReply: (callback: (result: { success: boolean; id: string; name: string; alias: Alias; error?: string }) => void) => void;

  deleteAlias: (id: string) => void;
  onDeleteAliasReply: (callback: (result: { success: boolean; id: string; name: string | null; error?: string }) => void) => void;

  syncAliasesFromCloud: (aliasData: AliasData) => Promise<{ success: boolean; error?: string }>; // Updated to accept AliasData

  getOSPlatform: () => Promise<any>;

  getAppearanceSetting: () => Promise<AppearanceSetting>;
  setAppearanceSetting: (appearance: AppearanceSetting) => Promise<{success: boolean, error?: string}>;
  getSystemAppearance: () => Promise<ActiveAppearance>;
  getCurrentActiveAppearance: () => Promise<ActiveAppearance>;
  onAppearanceUpdated: (callback: (theme: ActiveAppearance) => void) => void;

  getPrimeThemeSetting: () => Promise<PrimeTheme>;
  setPrimeThemeSetting: (theme: PrimeTheme) => Promise<{success: boolean, error?: string}>;

  checkForUpdates: () => void;
  installUpdate: () => void;
  onUpdaterStatus: (callback: (status: UpdateStatus) => void) => void;

  authenticateWithGitHub: (userData: { user: any; token: string }) => void;
  onAuthSuccess: (callback: (decodedToken: any) => void) => void;
  onAuthError: (callback: (error: any) => void) => void;

  logOut: () => void;
  onLogOutSuccess: (callback: () => void) => void;

  onAliasesUpdated: (callback: (aliasData: AliasData) => void) => void; // Updated callback type

  removeAllListeners: (channel: string) => void;
}

// Declare the global window object extension
declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
