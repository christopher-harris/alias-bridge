import {effect, Injectable, NgZone, OnDestroy, Signal, signal, WritableSignal} from '@angular/core';
import {ActiveAppearance, AppearanceSetting, PrimeTheme} from '../electron';

@Injectable({
  providedIn: 'root'
})
export class AppearanceService implements OnDestroy {
  // --- State Signals ---
  // Stores the user's preference ('light', 'dark', 'system')
  private appearanceSettingState: WritableSignal<AppearanceSetting> = signal<AppearanceSetting>('system');
  // Stores the *currently active* theme ('light' or 'dark')
  private activeAppearanceState: WritableSignal<ActiveAppearance> = signal<ActiveAppearance>('light');

  // --- Public Readonly Signals ---
  public readonly appearanceSetting: Signal<AppearanceSetting> = this.appearanceSettingState.asReadonly();
  public readonly activeAppearance: Signal<ActiveAppearance> = this.activeAppearanceState.asReadonly();

  public readonly availableAppearanceSettings: AppearanceSetting[] = ['light', 'dark', 'system'];

  constructor(private ngZone: NgZone) {
    this.initializeTheme();
    this.setupListeners();

    // Effect to apply theme class to body when activeTheme changes
    effect(() => {
      const theme = this.activeAppearance(); // Read signal value
      // console.log(`ThemeService Effect: Applying theme '${theme}' to body`);
      const htmlElement = document.querySelector('html')!;
      // htmlElement.classList.toggle(`theme-dark`);
      htmlElement.classList.remove('theme-light', 'theme-dark');
      htmlElement.classList.add(`theme-${theme}`);
    });
  }

  ngOnDestroy(): void {
    // console.log('ThemeService: Destroying and cleaning up listeners');
    window.electronAPI?.removeAllListeners('theme-updated');
  }

  private async initializeTheme(): Promise<void> {
    if (!window.electronAPI) {
      // console.error('ThemeService: Electron API not available during init.');
      // Fallback or default theme if API not ready
      document.body.classList.add('theme-light'); // Default to light maybe
      return;
    }
    try {
      // console.log('ThemeService: Initializing theme...');
      const initialSetting = await window.electronAPI.getAppearanceSetting();
      const initialActiveAppearance = await window.electronAPI.getCurrentActiveAppearance();

      // console.log(`ThemeService: Initial Setting='${initialSetting}', Initial Effective='${initialActiveAppearance}'`);
      this.appearanceSettingState.set(initialSetting);
      this.activeAppearanceState.set(initialActiveAppearance); // This will trigger the effect
    } catch (error) {
      // console.error("ThemeService: Error initializing theme:", error);
      // Fallback if needed
      this.activeAppearanceState.set('light');
    }
  }

  private setupListeners(): void {
    if (!window.electronAPI) { return; }

    window.electronAPI.onAppearanceUpdated((theme: ActiveAppearance) => {
      // console.log(`ThemeService: Received theme-updated event: ${theme}`);
      // Run in zone as it's an external event updating state
      this.ngZone.run(() => {
        this.activeAppearanceState.set(theme); // Update active theme, effect applies it
        // We also need to fetch the *setting* again in case it changed
        // Although the set-theme IPC handler already triggers theme-updated,
        // this ensures consistency if only the system theme changed.
        this.fetchCurrentSetting();
      });
    });
  }

  // Helper to re-fetch setting without triggering full init loop
  private async fetchCurrentSetting() {
    if (!window.electronAPI) return;
    try {
      const setting = await window.electronAPI.getAppearanceSetting();
      this.appearanceSettingState.set(setting);
    } catch (error) {
      // console.error("ThemeService: Error fetching current theme setting:", error);
    }
  }


  /**
   * Tells the backend to save the user's theme preference.
   * The active theme signal will be updated via the 'theme-updated' listener.
   */
  async setAppearancePreference(setting: AppearanceSetting): Promise<void> {
    if (!window.electronAPI) {
      // console.error('ThemeService: Electron API not available to set theme.');
      return;
    }
    try {
      // console.log(`ThemeService: Requesting set theme preference to: ${setting}`);
      const result = await window.electronAPI.setAppearanceSetting(setting);
      if (result.success) {
        // Update the local setting signal immediately for responsiveness
        this.appearanceSettingState.set(setting);
        // The listener 'onThemeUpdated' will handle updating the active theme signal
        // console.log(`Theme setting '${setting}' saved successfully via backend.`);
      } else {
        // console.error("ThemeService: Failed to set theme setting via backend:", result.error);
        // Optionally revert settingState or show error to user
      }
    } catch (error) {
      // console.error("ThemeService: Error calling setAppearanceSetting:", error);
      // Show error to user
    }
  }
}
