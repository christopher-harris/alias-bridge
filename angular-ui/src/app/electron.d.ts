interface Alias {
  name: string;
  command: string;
  comment?: string;
}

// alias-bridge/angular-ui/src/app/electron.d.ts
// Declare the interface matching the preload script's exposed API
export interface IElectronAPI {
  sendMessage: (message: string) => void;
  onMessageReply: (callback: (message: string) => void) => void;

  getAliases: () => Promise<Alias[]>;
  addAlias: (alias: Alias) => void;
  onAddAliasReply: (callback: (result: { success: boolean; name: string; error?: string }) => void) => void;

  removeAllListeners: (channel: string) => void;
  getOSPlatform: () => Promise<string>;
}

// Declare the global window object extension
declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
