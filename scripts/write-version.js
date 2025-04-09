// alias-bridge/scripts/write-version.js
const fs = require('fs');
const path = require('path'); // Ensure path is required

// --- Configuration ---
const rootDir = path.join(__dirname, '..'); // Project root directory
const angularUiDir = path.join(rootDir, 'angular-ui');
const rootPackageJsonPath = path.join(rootDir, 'package.json');
const angularPackageJsonPath = path.join(angularUiDir, 'package.json');
const versionTsPath = path.join(angularUiDir, 'src', 'environments', 'version.ts');
const versionTsDir = path.dirname(versionTsPath);

// --- Read Version from Root ---
let appVersion;
try {
    appVersion = require(rootPackageJsonPath).version;
    if (!appVersion) throw new Error('Version not found in root package.json');
} catch (error) {
    console.error(`Error reading version from ${rootPackageJsonPath}:`, error);
    process.exit(1);
}

console.log(`Root package.json version found: ${appVersion}`);

// --- 1. Write Version to Angular Environment File ---
console.log(`Attempting to write version ${appVersion} to Angular environment file...`);
const versionTsContent = `// IMPORTANT: THIS FILE IS AUTO GENERATED! DO NOT MANUALLY EDIT OR CHECKIN!
// See scripts/write-version.js for details.

export const APP_VERSION = '${appVersion}';
`;

try {
    // Ensure the target directory exists
    if (!fs.existsSync(versionTsDir)) {
        console.log(`Creating directory: ${versionTsDir}`);
        fs.mkdirSync(versionTsDir, { recursive: true });
    }
    // Write the file
    fs.writeFileSync(versionTsPath, versionTsContent, { encoding: 'utf-8' });
    console.log(`Successfully wrote version to ${versionTsPath}`);
} catch (error) {
    console.error(`Error writing version file to ${versionTsPath}:`, error);
    process.exit(1);
}

// --- 2. Update Version in Angular package.json ---
console.log(`Attempting to update version in ${angularPackageJsonPath}...`);
try {
    // Read the Angular package.json
    const angularPackageJsonContent = fs.readFileSync(angularPackageJsonPath, { encoding: 'utf-8' });
    const angularPackageJson = JSON.parse(angularPackageJsonContent);

    // Check if version needs updating
    if (angularPackageJson.version !== appVersion) {
        console.log(`Updating angular-ui version from ${angularPackageJson.version} to ${appVersion}...`);
        angularPackageJson.version = appVersion;

        // Write the updated package.json back (with standard 2-space indent)
        fs.writeFileSync(angularPackageJsonPath, JSON.stringify(angularPackageJson, null, 2) + '\n', { encoding: 'utf-8' });
        console.log(`Successfully updated version in ${angularPackageJsonPath}`);
    } else {
        console.log(`Version in ${angularPackageJsonPath} is already ${appVersion}. No update needed.`);
    }

} catch (error) {
    console.error(`Error updating version in ${angularPackageJsonPath}:`, error);
    // Decide if this should be a fatal error - maybe not if version.ts worked?
    // process.exit(1);
}

console.log("Version synchronization script finished.");
