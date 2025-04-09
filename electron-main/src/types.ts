export interface Alias {
    id: string;
    name: string;
    command: string;
    comment?: string;
}

export type IncomingAliasData = Omit<Alias, 'id'>;

export type AppearanceSetting = 'light' | 'dark' | 'system';
export type ActiveAppearance = 'light' | 'dark';

export type PrimeTheme = 'aura' | 'lara' | 'nora' | 'material';

export interface UpdateStatus {
    status: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error';
    message: string;
    progress?: number; // Percentage for 'downloading' status
}
