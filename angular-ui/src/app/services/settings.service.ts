import {effect, Injectable, NgZone, OnDestroy, Signal, signal, WritableSignal, Inject, inject} from '@angular/core';
import {ActiveAppearance, AppearanceSetting, PrimeTheme} from '../electron';
import {DOCUMENT} from '@angular/common';
import {RendererFactory2} from '@angular/core';
import {Store} from '@ngrx/store';
import {LocalSettingsActions} from '../state/local-settings/local-settings.actions';

/**
 * A service that manages all application settings including appearance and UI theme preferences.
 * This service handles both the system-level appearance settings (light/dark/system) and
 * the PrimeNG theme customization (aura/lara/nora/material).
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService implements OnDestroy {
  store = inject(Store);

  // --- Appearance State Signals ---
  /** Internal signal tracking the user's appearance setting preference (light/dark/system) */
  private appearanceSettingState: WritableSignal<AppearanceSetting> = signal<AppearanceSetting>('system');
  /** Internal signal tracking the currently active appearance (light/dark) */
  private activeAppearanceState: WritableSignal<ActiveAppearance> = signal<ActiveAppearance>('light');

  // --- PrimeNG Theme State Signals ---
  /** Internal signal tracking the currently selected PrimeNG theme */
  private primeThemeState = signal<PrimeTheme>('aura');

  // --- Public Readonly Signals ---
  /** Public readonly signal exposing the current appearance setting */
  public readonly appearanceSetting: Signal<AppearanceSetting> = this.appearanceSettingState.asReadonly();
  /** Public readonly signal exposing the currently active appearance */
  public readonly activeAppearance: Signal<ActiveAppearance> = this.activeAppearanceState.asReadonly();
  /** Public readonly signal exposing the current PrimeNG theme */
  public readonly primeTheme: Signal<PrimeTheme> = this.primeThemeState.asReadonly();

  // --- Public Constants ---
  /** Available appearance settings that can be selected by the user */
  public readonly availableAppearanceSettings: AppearanceSetting[] = ['light', 'dark', 'system'];
  /** Available PrimeNG themes that can be selected by the user */
  public readonly availablePrimeThemes: PrimeTheme[] = ['aura', 'lara', 'nora', 'material'];

  /**
   * Creates an instance of SettingsService.
   * @param ngZone - Angular's NgZone service for running code outside Angular's zone
   * @param document - The document object for DOM manipulation
   * @param rendererFactory - Factory for creating renderers
   */
  constructor(
    private ngZone: NgZone,
    @Inject(DOCUMENT) private document: Document,
    rendererFactory: RendererFactory2
  ) {
    this.initializeSettings();
    this.setupListeners();

    // Effect to apply theme class to body when activeTheme changes
    effect(() => {
      const theme = this.activeAppearance();
      const htmlElement = document.querySelector('html')!;
      htmlElement.classList.remove('theme-light', 'theme-dark');
      htmlElement.classList.add(`theme-${theme}`);
    });
  }

  /**
   * Cleanup method called when the service is destroyed.
   * Removes all appearance update listeners from the Electron API.
   */
  ngOnDestroy(): void {
    window.electronAPI?.removeAllListeners('appearance-updated');
  }

  /**
   * Initializes all settings by fetching their current values from the backend.
   * Sets default values if the backend is not available or if there's an error.
   */
  private async initializeSettings(): Promise<void> {
    console.log('Settings service initialized.');
    if (!window.electronAPI) {
      document.body.classList.add('theme-light');
      return;
    }

    try {
      // Initialize appearance settings
      const initialSetting = await window.electronAPI.getAppearanceSetting();
      const initialActiveAppearance = await window.electronAPI.getCurrentActiveAppearance();
      this.appearanceSettingState.set(initialSetting);
      this.activeAppearanceState.set(initialActiveAppearance);

      // Initialize PrimeNG theme
      const initialPrimeTheme = await window.electronAPI.getPrimeThemeSetting();
      this.primeThemeState.set(initialPrimeTheme);
    } catch (error) {
      console.error('Error initializing settings:', error);
      this.activeAppearanceState.set('light');
      this.primeThemeState.set('aura');
    }
  }

  /**
   * Sets up listeners for appearance-related events from the backend.
   * These listeners update the local state when changes occur in the system.
   */
  private setupListeners(): void {
    if (!window.electronAPI) { return; }

    window.electronAPI.onAppearanceUpdated((theme: ActiveAppearance) => {
      this.ngZone.run(() => {
        this.activeAppearanceState.set(theme);
        this.fetchCurrentSetting();
      });
    });
  }

  /**
   * Fetches the current appearance setting from the backend.
   * Used to ensure local state stays in sync with backend state.
   */
  private async fetchCurrentSetting(): Promise<void> {
    if (!window.electronAPI) return;
    try {
      const setting = await window.electronAPI.getAppearanceSetting();
      this.appearanceSettingState.set(setting);
      this.store.dispatch(LocalSettingsActions.updateAppearance({ appearance: setting }));
    } catch (error) {
      console.error('Error fetching current appearance setting:', error);
    }
  }

  /**
   * Updates the user's appearance preference (light/dark/system).
   * @param setting - The new appearance setting to apply
   */
  async setAppearancePreference(setting: AppearanceSetting): Promise<void> {
    console.log(setting);
    if (!window.electronAPI) {
      console.error('Electron API not available to set appearance preference.');
      return;
    }

    try {
      const result = await window.electronAPI.setAppearanceSetting(setting);
      if (result.success) {
        console.log(result);
      } else {
        console.error('Failed to set appearance setting:', result.error);
      }
    } catch (error) {
      console.error('Error setting appearance preference:', error);
    }
  }

  /**
   * Updates the PrimeNG theme preference.
   * @param themeName - The new PrimeNG theme to apply
   */
  async setPrimeThemePreference(themeName: PrimeTheme): Promise<void> {
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.setPrimeThemeSetting(themeName);
      if (result?.success) {
        console.log(result);
        console.log(`Prime theme setting '${themeName}' saved successfully.`);
      } else {
        console.error('Failed to set Prime theme:', result?.error);
      }
    } catch (error) {
      console.error('Error setting Prime theme preference:', error);
    }
  }
}
