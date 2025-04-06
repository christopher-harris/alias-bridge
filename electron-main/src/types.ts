export interface Alias {
    id: string;
    name: string;
    command: string;
    comment?: string;
}

export type IncomingAliasData = Omit<Alias, 'id'>;
