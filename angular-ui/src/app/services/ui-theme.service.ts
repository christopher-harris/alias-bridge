import {Inject, Injectable, NgZone, OnDestroy, RendererFactory2, signal} from '@angular/core';
import {PrimeTheme} from '../electron';
import {DOCUMENT} from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class UiThemeService implements OnDestroy {

  // --- PrimeNG Theme State ---
  private primeThemeState = signal<PrimeTheme>('aura'); // Default theme base name
  public readonly primeTheme = this.primeThemeState.asReadonly();
  public readonly availablePrimeThemes: PrimeTheme[] = ['aura', 'lara', 'nora', 'material'];

  constructor(private ngZone: NgZone,
              @Inject(DOCUMENT) private document: Document,
              rendererFactory: RendererFactory2) {
    this.initializeTheme();
  }

  ngOnDestroy(): void {
    window.electronAPI?.removeAllListeners('appearance-updated');
    // Add cleanup for any new listeners
  }

  private async initializeTheme() {
    if (!window.electronAPI) { /* ... error handling ... */ return; }
    try {
      const initialPrimeTheme = await window.electronAPI.getPrimeThemeSetting();
      this.primeThemeState.set(initialPrimeTheme);
    } catch (e) {
      console.error(e);
      this.primeThemeState.set('aura');
    }
  }

  async setPrimeThemePreference(themeName: PrimeTheme): Promise<void> {
    if (!window.electronAPI) { return; }
    try {
      // Assume setPrimeThemeSetting IPC handler exists
      const result = await window.electronAPI.setPrimeThemeSetting(themeName);
      if (result?.success) {
        this.primeThemeState.set(themeName); // Update signal, effect will handle link change
        console.log(`Prime theme setting '${themeName}' saved successfully via backend.`);
      } else { /* ... handle error ... */ }
    } catch (error) { /* ... handle error ... */ }
  }
}
