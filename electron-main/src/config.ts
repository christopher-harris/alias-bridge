import path from 'path';
import os from 'os';
import { app } from 'electron';
import dotenv from "dotenv";
import logger from "electron-log";
import fs from "fs"; // Import app only if needed for paths like userData

const FORCE_ENV_FILE = process.env.FORCE_ENV_FILE; // Optional override

export const IS_DEV = FORCE_ENV_FILE
    ? FORCE_ENV_FILE === 'dev'
    : process.env.NODE_ENV !== 'production' && !app.isPackaged;

// const prodPathLocal = path.resolve(__dirname, '../.env.prod');
// const prodPathPackaged = path.join(process.resourcesPath, '.env.prod');
//
// const envFilePath = IS_DEV
//     ? path.resolve(__dirname, '../.env')
//     : fs.existsSync(prodPathLocal) ? prodPathLocal : prodPathPackaged;

const prodPathLocal = path.resolve(__dirname, '../.env.prod');
const prodPathPackaged = path.join(process.resourcesPath, '.env.prod');

const envFilePath = fs.existsSync(prodPathLocal)
    ? prodPathLocal
    : prodPathPackaged;

// Load environment variables
dotenv.config({ path: envFilePath });

// Logging
logger.info('[Config] NODE_ENV:', process.env.NODE_ENV);
logger.info('[Config] isPackaged:', app.isPackaged);
logger.info('[Config] IS_DEV:', IS_DEV);
logger.info('[Config] Using envFilePath:', envFilePath);
logger.info('[Config] Env File Exists:', fs.existsSync(envFilePath));
logger.info('[Config] Checking env path (local):', prodPathLocal, fs.existsSync(prodPathLocal));
logger.info('[Config] Checking env path (packaged):', prodPathPackaged, fs.existsSync(prodPathPackaged));
logger.info('[Config] FIREBASE_ENV:', process.env.FIREBASE_ENV);
logger.info('[Config] FULL ENV DUMP:', JSON.stringify(process.env, null, 2));

// Final export
export const FIREBASE_ENV: 'dev' | 'prod' =
    process.env.FIREBASE_ENV === 'prod' ? 'prod' : 'dev';

export const PLATFORM = process.platform;

export const JSON_DATA_FILENAME = '.alias_bridge_data.json';
export const SHELL_ALIAS_FILENAME = '.alias_bridge_aliases.sh';

export const JSON_DATA_FILE_PATH = path.join(os.homedir(), JSON_DATA_FILENAME);
export const SHELL_ALIAS_FILE_PATH = path.join(os.homedir(), SHELL_ALIAS_FILENAME);
