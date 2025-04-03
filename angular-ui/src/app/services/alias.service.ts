import {computed, effect, inject, Injectable, NgZone, OnDestroy, Signal, signal, WritableSignal} from '@angular/core';
import {Alias} from '../electron';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AliasService implements OnDestroy {
  router = inject(Router);

  // --- State Signals ---
  // Private writable signals for internal state management
  private aliasesState: WritableSignal<Alias[]> = signal<Alias[]>([]);
  private loadingState: WritableSignal<boolean> = signal<boolean>(false);
  private errorState: WritableSignal<string | null> = signal<string | null>(null);
  private currentOS: WritableSignal<string> = signal<string>('unknown');

  // --- Public Read-only Signals for Consumption ---
  // Expose state immutably to components
  public readonly aliases: Signal<Alias[]> = this.aliasesState.asReadonly();
  public readonly loading: Signal<boolean> = this.loadingState.asReadonly();
  public readonly error: Signal<string | null> = this.errorState.asReadonly();
  public readonly operatingSystem: Signal<string> = this.currentOS.asReadonly();

  // --- Optional Computed Signal ---
  public readonly aliasCount: Signal<number> = computed(() => this.aliasesState().length);

  constructor(private ngZone: NgZone) {
    this.setupListeners();
    this.checkOS();

    // Example of using effect (optional): log changes
    effect(() => {
      console.log('AliasService: Aliases changed, count:', this.aliasCount());
      // Note: Avoid triggering async operations directly inside effects
      // if they update signals the effect depends on, to prevent loops.
    });
  }

  ngOnDestroy(): void {
    console.log('AliasService: Destroying and cleaning up listeners');
    window.electronAPI?.removeAllListeners('add-alias-reply');
  }

  private async checkOS(): Promise<void> {
    this.currentOS.set(await window.electronAPI.getOSPlatform() || 'unknown');
  }

  private setupListeners(): void {
    if (!window.electronAPI) {
      console.warn('AliasService: Electron API not available during listener setup.');
      return;
    }

    console.log('AliasService: Setting up add-alias-reply listener (for Signals)');
    const handleAddAliasReply = (result: { success: boolean; name: string; error?: string }) => {
      console.log('AliasService: Received add-alias-reply (for Signals):', result);

      // *** Still need NgZone.run() for IPC callbacks ***
      this.ngZone.run(() => {
        if (result.success) {
          // Reload the list after successful add
          this.loadAliases(); // Re-fetch to update state signal
          this.router.navigate(['/']);
        } else {
          // Update the error signal
          this.errorState.set(`Failed to add alias '${result.name}': ${result.error || 'Unknown error'}`);
          // Optionally clear the error after some time
          setTimeout(() => this.errorState.set(null), 5000);
        }
      });
    };

    window.electronAPI.onAddAliasReply(handleAddAliasReply);
  }

  /**
   * Fetches the current list of aliases from the Electron main process.
   */
  async loadAliases(): Promise<void> {
    console.log('AliasService: Requesting aliases (for Signals)...');
    if (!window.electronAPI) {
      console.error('AliasService: Electron API is not available.');
      this.errorState.set('Electron API is not available.');
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null); // Clear previous errors

    try {
      const fetchedAliases = await window.electronAPI.getAliases();
      console.log('AliasService: Aliases received (for Signals):', fetchedAliases);
      // Update the state signal
      this.aliasesState.set(fetchedAliases || []);
    } catch (error: any) {
      console.error('AliasService: Error loading aliases:', error);
      this.errorState.set(`Failed to load aliases: ${error.message || error}`);
      this.aliasesState.set([]); // Clear aliases on error
    } finally {
      this.loadingState.set(false);
    }
  }

  /**
   * Sends a request to the Electron main process to add a new alias.
   */
  addAlias(alias: Alias): void {
    console.log('AliasService: Requesting to add alias (for Signals):', alias);
    if (!window.electronAPI) {
      console.error('AliasService: Electron API is not available.');
      this.errorState.set('Electron API is not available.');
      return;
    }

    this.errorState.set(null); // Clear previous errors

    // Send the request - response handled by the listener
    window.electronAPI.addAlias(alias);
  }

  // --- Add methods for delete/edit later ---
}
