const fs = require('fs');
const path = require('path');
const appVersion = require('../package.json').version;

console.log(`Writing version ${appVersion} to environment file...`);

// Define the path for the output version file within the Angular app
const versionFilePath = path.join(__dirname, '..', 'angular-ui', 'src', 'environments', 'version.ts');
const envDir = path.dirname(versionFilePath); // Get the directory path: ../angular-ui/src/environments
const versionFileContent = `// IMPORTANT: THIS FILE IS AUTO GENERATED! DO NOT MANUALLY EDIT OR CHECKIN!
// See scripts/write-version.js for details.

export const APP_VERSION = '${appVersion}';
`;

try {
    // Ensure the target directory exists; create it if it doesn't
    if (!fs.existsSync(envDir)) {
        console.log(`Creating directory: ${envDir}`);
        fs.mkdirSync(envDir, { recursive: true }); // Use recursive: true to create parent dirs if needed
    }

    // Write the version information to the file
    fs.writeFileSync(versionFilePath, versionFileContent, { encoding: 'utf-8' });
    console.log(`Successfully wrote version ${appVersion} to ${versionFilePath}`);

} catch (error) {
    console.error(`Error writing version file to ${versionFilePath}:`, error);
    process.exit(1); // Exit with error code if writing fails
}
