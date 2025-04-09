interface Alias {
  id: string;
  name: string;
  command: string;
  comment?: string;
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
  getOSPlatform: () => Promise<string>;

  getAliases: () => Promise<Alias[]>;
  addAlias: (alias: NewAlias) => void;
  onAddAliasReply: (callback: (result: { success: boolean; name: string; error?: string }) => void) => void;

  // --- Update uses ID and full Alias object ---
  updateAlias: (id: string, alias: Alias) => void;
  onUpdateAliasReply: (callback: (result: { success: boolean; id: string; name: string; error?: string }) => void) => void;

  // --- Delete uses ID ---
  deleteAlias: (id: string) => void;
  onDeleteAliasReply: (callback: (result: { success: boolean; id: string; name: string | null; error?: string }) => void) => void;

  // --- Appearance Methods ---
  getAppearanceSetting: () => Promise<AppearanceSetting>;
  setAppearanceSetting: (theme: AppearanceSetting) => Promise<{success: boolean, error?: string}>;
  getSystemAppearance: () => Promise<ActiveAppearance>;
  getCurrentActiveAppearance: () => Promise<ActiveAppearance>;
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

// Declare the global window object extension
declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
