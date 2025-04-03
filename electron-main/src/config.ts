// electron-main/src/config.ts
import path from 'path';
import os from 'os';
import { app } from 'electron'; // Import app only if needed for paths like userData

export const IS_DEV = process.env.NODE_ENV !== 'production' && !app.isPackaged;
export const PLATFORM = process.platform; // 'darwin', 'win32', 'linux'

export const JSON_DATA_FILENAME = '.alias_bridge_data.json';
export const SHELL_ALIAS_FILENAME = '.alias_bridge_aliases.sh'; // Keep using .sh for Phase 1

export const JSON_DATA_FILE_PATH = path.join(os.homedir(), JSON_DATA_FILENAME);
export const SHELL_ALIAS_FILE_PATH = path.join(os.homedir(), SHELL_ALIAS_FILENAME);

// Optionally add app name, version later if needed
// export const APP_NAME = 'AliasBridge';
