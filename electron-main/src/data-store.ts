import fs from 'fs/promises';
import { JSON_DATA_FILE_PATH } from './config';
import type { Alias } from './types'; // Use 'type' for interface import

/**
 * Reads alias data from the JSON file.
 * Returns an empty array if the file doesn't exist or is invalid.
 */
export async function readAliasData(): Promise<Alias[]> {
    try {
        const data = await fs.readFile(JSON_DATA_FILE_PATH, 'utf8');
        const aliases: Alias[] = JSON.parse(data);
        return Array.isArray(aliases) ? aliases : [];
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.log(`Data file (${JSON_DATA_FILE_PATH}) not found, returning empty array.`);
            return [];
        }
        console.error('Error reading or parsing alias data file:', error);
        return [];
    }
}

/**
 * Writes the complete alias array to the JSON file.
 */
export async function saveAliasData(aliases: Alias[]): Promise<void> {
    try {
        const data = JSON.stringify(aliases, null, 2); // Pretty-print JSON
        await fs.writeFile(JSON_DATA_FILE_PATH, data, 'utf8');
        console.log('Alias data saved successfully to JSON.');
    } catch (error) {
        console.error('Error writing alias data file:', error);
        throw error; // Re-throw error for the caller (IPC handler) to manage
    }
}
