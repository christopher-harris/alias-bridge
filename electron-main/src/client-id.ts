import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

const idFilePath = path.join(os.homedir(), '.alias-bridge-client-id');

export function getClientId(): string {
    if (existsSync(idFilePath)) {
        return readFileSync(idFilePath, 'utf-8');
    }

    const newId = uuidv4(); // 🔑 make sure this is unique per machine
    writeFileSync(idFilePath, newId);
    return newId;
}
