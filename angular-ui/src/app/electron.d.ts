interface Alias {
  id: string;
  name: string;
  command: string;
  comment?: string;
}

export type NewAlias = Omit<Alias, 'id'>;

// alias-bridge/angular-ui/src/app/electron.d.ts
// Declare the interface matching the preload script's exposed API
export interface IElectronAPI {
  sendMessage: (message: string) => void;
  onMessageReply: (callback: (message: string) => void) => void;

  getAliases: () => Promise<Alias[]>;
  addAlias: (alias: NewAlias) => void;
  onAddAliasReply: (callback: (result: { success: boolean; name: string; error?: string }) => void) => void;

  // --- Update uses ID and full Alias object ---
  updateAlias: (id: string, alias: Alias) => void;
  onUpdateAliasReply: (callback: (result: { success: boolean; id: string; name: string; error?: string }) => void) => void;

  // --- Delete uses ID ---
  deleteAlias: (id: string) => void;
  onDeleteAliasReply: (callback: (result: { success: boolean; id: string; name: string | null; error?: string }) => void) => void;

  removeAllListeners: (channel: string) => void;
  getOSPlatform: () => Promise<string>;
}

// Declare the global window object extension
declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
