// electron-main/src/tray-manager.ts
import { app, Menu, Tray, nativeImage, BrowserWindow } from 'electron';
import path from 'path';

// Import functions from other managers that the tray actions will trigger
import { toggleViewerWindow } from './viewer-window-manager';
import { showMainWindow } from './window-manager'; // To show the main app window

// Module-level variable to hold the Tray instance
let tray: Tray | null = null;

/**
 * Creates the system tray icon and context menu.
 */
export function createTray(): void {
    // Check if tray already exists or if running in dev without app path (can cause issues)
    if (tray || !app.isPackaged && process.env.NODE_ENV === 'development') {
        if(tray) console.log('Tray already exists.');
        // Skipping tray creation in dev sometimes helps avoid issues if asset paths are tricky before packaging
        // console.log('Skipping tray creation in development mode for stability.');
        // return;
    }

    // --- Define Icon Path ---
    // It's often best to place tray icons directly accessible, maybe outside asar in prod,
    // or ensure the path is correctly resolved within asar.
    // Let's assume it's copied as an asset during build like other icons.
    // assets/build/alias_bridge_icon_dark/icon.iconset/icon_16x16.png
    const iconFileName = 'icon_16x16.png'; // Use template image for macOS dark/light mode
    const iconPath = app.isPackaged
        ? path.join(process.resourcesPath, 'assets/build/alias_bridge_icon_dark/icon.iconset/', iconFileName) // Path within packaged app structure (adjust if needed)
        : path.join(__dirname, '../../assets/build/alias_bridge_icon_dark/icon.iconset/', iconFileName); // Path relative to dist-electron/src for dev

    console.log(`Attempting to load tray icon from: ${iconPath}`);

    // --- Create Native Image ---
    let image;
    try {
        image = nativeImage.createFromPath(iconPath);
        // On macOS, template images are automatically handled for dark/light mode.
        // Setting explicitly can sometimes help if detection fails.
        if (process.platform === 'darwin') {
            image.setTemplateImage(true);
        }
        console.log('Tray icon loaded successfully.');
    } catch (error) {
        console.error(`Failed to load tray icon from ${iconPath}:`, error);
        // Provide a fallback or skip tray creation
        // You could try creating a simple text-based tray icon as fallback:
        // tray = new Tray(nativeImage.createEmpty()); // Requires setting title later maybe? Or just fail.
        console.error("Tray icon could not be created. Tray functionality disabled.");
        return; // Exit if icon fails
    }


    // --- Create Tray Instance ---
    tray = new Tray(image);

    // --- Set Tooltip ---
    tray.setToolTip('AliasBridge');

    // --- Create Context Menu ---
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'View Aliases', // Action to open the small viewer window
            click: () => {
                console.log('Tray Menu: View Aliases clicked');
                toggleViewerWindow(tray); // Call function from viewer-window-manager
            }
        },
        {
            label: 'Open AliasBridge', // Action to open/focus the main application window
            click: () => {
                console.log('Tray Menu: Open AliasBridge clicked');
                showMainWindow(); // Call function from window-manager
            }
        },
        { type: 'separator' },
        {
            label: 'Quit AliasBridge', // Action to quit the application
            click: () => {
                console.log('Tray Menu: Quit clicked');
                app.quit(); // Triggers the application quit sequence
            }
        }
    ]);

    // --- Assign Menu and Click Handler ---
    tray.setContextMenu(contextMenu);

    // Optional: Define behavior for left-click (differs by OS)
    tray.on('click', (event, bounds) => {
        // On Windows/Linux, left-click often toggles visibility or shows primary action
        // On macOS, left-click usually does nothing by default (menu bar apps), context menu is standard
        if (process.platform !== 'darwin') {
            console.log('Tray: Left-click detected (Win/Linux)');
            // Option 1: Toggle the viewer window
            toggleViewerWindow(tray);
            // Option 2: Show the main window
            // showMainWindow();
        } else {
            console.log('Tray: Left-click detected (macOS - typically ignored or opens menu)');
            // By default, macOS might open the context menu anyway on left click depending on config.
            // Or explicitly do nothing, or toggle viewer:
            // toggleViewerWindow(tray);
        }
    });

    // Optional: Handle right-click explicitly if needed (usually context menu is default)
    // tray.on('right-click', () => {
    //     tray?.popUpContextMenu(contextMenu);
    // });

    console.log('Tray icon and menu created successfully.');
}

/**
 * Destroys the tray icon if it exists. Called before quitting.
 */
export function destroyTray(): void {
    if (tray && !tray.isDestroyed()) {
        console.log('Destroying tray icon.');
        tray.destroy();
    }
    tray = null;
}
