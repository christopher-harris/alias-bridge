import fs from 'fs/promises';
import { JSON_DATA_FILE_PATH } from './config';
import type {Alias, AliasData, DeletedAlias} from './types';

const aliasDataPath = JSON_DATA_FILE_PATH;

export async function readAliasData(): Promise<AliasData> {
    try {
        const file = await fs.readFile(aliasDataPath, 'utf-8');
        return JSON.parse(file) as AliasData;
    } catch (err) {
        return {
            updatedAt: 0, updatedBy: "",
            aliases: {},
            deleted: {}
        };
    }
}

export async function saveAliasData(data: AliasData): Promise<void> {
    await fs.writeFile(aliasDataPath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function getAllAliases(): Promise<Alias[]> {
    const data = await readAliasData();
    return Object.values(data.aliases);
}

export async function getDeletedAliases(): Promise<DeletedAlias[]> {
    const data = await readAliasData();
    return Object.values(data.deleted);
}

// export async function readAliasData(): Promise<AliasData> {
//     try {
//         if (!data.trim()) return [];
//         const aliases: Alias[] = JSON.parse(data);
//         return Array.isArray(aliases) ? aliases : [];
//     } catch (error: any) {
//         if (error.code === 'ENOENT') {
//             console.log(`Data file (${JSON_DATA_FILE_PATH}) not found, returning empty array.`);
//             return [];
//         }
//         console.error('Error reading or parsing alias data file:', error);
//         return [];
//     }
// }

// export async function saveAliasData(aliases: Alias[]): Promise<void> {
//     try {
//         const data = JSON.stringify(aliases, null, 2); // Pretty-print JSON
//         await fs.writeFile(JSON_DATA_FILE_PATH, data, 'utf8');
//         console.log('Alias data saved successfully to JSON.');
//     } catch (error) {
//         console.error('Error writing alias data file:', error);
//         throw error; // Re-throw error for the caller (IPC handler) to manage
//     }
// }
