import {computed, effect, inject, Injectable, NgZone, OnDestroy, Signal, signal, WritableSignal} from '@angular/core';
import {Alias, NewAlias} from '../electron';
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
  private successState: WritableSignal<any | null> = signal<any | null>(null);

  // --- Public Read-only Signals for Consumption ---
  // Expose state immutably to components
  public readonly aliases: Signal<Alias[]> = this.aliasesState.asReadonly();
  public readonly loading: Signal<boolean> = this.loadingState.asReadonly();
  public readonly error: Signal<string | null> = this.errorState.asReadonly();
  public readonly operatingSystem: Signal<string> = this.currentOS.asReadonly();
  public readonly successMessage: Signal<string | null> = this.successState.asReadonly();

  // --- Optional Computed Signal ---
  public readonly aliasCount: Signal<number> = computed(() => this.aliasesState().length);

  constructor(private ngZone: NgZone) {
    this.setupListeners();
    this.checkOS();

    // Example of using effect (optional): log changes
    effect(() => {
      // console.log('AliasService: Aliases changed, count:', this.aliasCount());
      // Note: Avoid triggering async operations directly inside effects
      // if they update signals the effect depends on, to prevent loops.
    });
  }

  ngOnDestroy(): void {
    // console.log('AliasService: Destroying and cleaning up listeners');
    window.electronAPI?.removeAllListeners('add-alias-reply');
    window.electronAPI?.removeAllListeners('update-alias-reply');
    window.electronAPI?.removeAllListeners('delete-alias-reply');
  }

  private async checkOS(): Promise<void> {
    this.currentOS.set(await window.electronAPI.getOSPlatform() || 'unknown');
  }

  private setupListeners(): void {
    if (!window.electronAPI) {
      console.warn('AliasService: Electron API not available during listener setup.');
      return;
    }

    // console.log('AliasService: Setting up add-alias-reply listener (for Signals)');
    const handleAddAliasReply = (result: { success: boolean; name: string; error?: string }) => {
      // console.log('AliasService: Received add-alias-reply (for Signals):', result);


      // *** Still need NgZone.run() for IPC callbacks ***
      this.ngZone.run(() => {
        if (result.success) {
          // Reload the list after successful add
          this.loadAliases(); // Re-fetch to update state signal
          this.router.navigate(['/']);
          this.successState.set(`Alias ${result.name} added successfully!`);
        } else {
          // Update the error signal
          this.errorState.set(`Failed to add alias '${result.name}': ${result.error || 'Unknown error'}`);
          // Optionally clear the error after some time
          setTimeout(() => this.errorState.set(null), 5000);
        }
      });
    };

    window.electronAPI.onAddAliasReply(handleAddAliasReply);

    window.electronAPI.onDeleteAliasReply((result) => {
      this.ngZone.run(() => {
        if (result.success) {
          // --- SET SUCCESS MESSAGE ---
          const message = `Alias '${result.name || 'ID: ' + result.id}' deleted successfully!`;
          // console.log(message);
          this.successState.set(message);
          // ---

          this.loadAliases();

          // --- Clear message after a delay ---
          setTimeout(() => this.successState.set(null), 3000); // Clear after 3 seconds
        } else {
          this.handleError('delete', result.name || `ID: ${result.id}`, result.error);
          this.successState.set(null);
        }
      });
    });

  }

  /**
   * Fetches the current list of aliases from the Electron main process.
   */
  async loadAliases(): Promise<void> {
    // console.log('AliasService: Requesting aliases (for Signals)...');
    if (!window.electronAPI) {
      console.error('AliasService: Electron API is not available.');
      this.errorState.set('Electron API is not available.');
      return;
    }

    this.loadingState.set(true);
    this.errorState.set(null); // Clear previous errors

    try {
      const fetchedAliases = await window.electronAPI.getAliases();
      // console.log('AliasService: Aliases received (for Signals):', fetchedAliases);
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
  addAlias(alias: NewAlias): void {
    // console.log('AliasService: Requesting to add alias (for Signals):', alias);
    if (!window.electronAPI) {
      console.error('AliasService: Electron API is not available.');
      this.errorState.set('Electron API is not available.');
      return;
    }

    this.errorState.set(null); // Clear previous errors

    // Send the request - response handled by the listener
    window.electronAPI.addAlias(alias);
  }

  updateAlias(id: string, alias: Alias): void {
    // Note: The 'alias' object passed in should contain the *updated* data,
    // but it MUST also retain the original 'id'. The backend uses the 'id' parameter
    // passed separately for lookup, and the 'alias' object for the new data.
    // console.log(`AliasService: Requesting update for ID '${id}' with data:`, alias);
    if (!window.electronAPI) {
      this.handleError('update', alias.name, 'Electron API not available');
      return;
    }
    if (id !== alias.id) {
      // Sanity check: the ID in the object should match the ID used for lookup
      console.error(`AliasService: Mismatched ID during update request! ID param: ${id}, Alias object ID: ${alias.id}`);
      this.handleError('update', alias.name, 'Internal error: ID mismatch.');
      return;
    }

    this.errorState.set(null); // Clear previous errors
    this.successState.set(null); // Clear success message
    window.electronAPI.updateAlias(id, alias); // Pass ID and the full updated object
    // Response handled by onUpdateAliasReply listener
  }

  // --- UPDATED: Delete Alias Method (uses ID) ---
  deleteAlias(id: string): void {
    // console.log(`AliasService: Requesting delete for alias ID: ${id}`);
    if (!window.electronAPI) {
      this.handleError('delete', `ID: ${id}`, 'Electron API not available'); // Update name placeholder
      return;
    }
    this.errorState.set(null);
    this.successState.set(null); // Clear success message
    window.electronAPI.deleteAlias(id);
    // Response handled by onDeleteAliasReply listener
  }

  // Helper for error handling (ensure name parameter allows null)
  private handleError(action: string, identifier: string | null, errorMsg?: string): void {
    const message = `Failed to ${action} alias${identifier ? " '" + identifier + "'" : ''}: ${errorMsg || 'Unknown error'}`;
    this.errorState.set(message);
    setTimeout(() => this.errorState.set(null), 5000);
  }

  // --- Add success message handling if using successState signal ---
  private handleSuccess(action: string, identifier: string | null): void {
    const message = `Alias${identifier ? " '" + identifier + "'" : ''} ${action}d successfully!`;
    this.successState.set(message);
    setTimeout(() => this.successState.set(null), 3000); // Clear message after 3s
  }

}
