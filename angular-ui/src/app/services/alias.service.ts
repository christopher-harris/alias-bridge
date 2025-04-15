import {computed, effect, inject, Injectable, NgZone, OnDestroy, Signal, signal, WritableSignal} from '@angular/core';
import {Alias, NewAlias} from '../electron';
import {Router} from '@angular/router';
import {LocalAliasesRepository} from '../state/local-aliases.repository';
import {Store} from '@ngrx/store';
import {LocalAliasesActions} from '../state/local-aliases/local-aliases.actions';

@Injectable({
  providedIn: 'root'
})
export class AliasService implements OnDestroy {
  store = inject(Store);
  router = inject(Router);
  localAliasesStore = inject(LocalAliasesRepository);

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
    // this.currentOS.set(await window.electronAPI.getOSPlatform() || 'unknown');
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
          console.log(result);
          this.store.dispatch(LocalAliasesActions.addLocalAlias({alias: (result as any).alias}));
          // this.router.navigate(['/']);
          // this.successState.set(`Alias ${result.name} added successfully!`);
        } else {
          this.store.dispatch(LocalAliasesActions.addLocalAliasFailed({ error: 'Could not create local alias!' }));
        }
      });
    };

    window.electronAPI.onAddAliasReply(handleAddAliasReply);

    window.electronAPI.onUpdateAliasReply((result) => {
      this.ngZone.run(() => {
        console.log(result);
        if (result.success) {
          this.store.dispatch(LocalAliasesActions.updateLocalAlias({
            alias: {
              id: result.id,
              changes: {
                ...result.alias
              }
            }
          }));
        } else {

        }
      });
    });

    window.electronAPI.onDeleteAliasReply((result) => {
      this.ngZone.run(() => {
        if (result.success) {
          console.log(result);
          this.store.dispatch(LocalAliasesActions.localAliasDeleted({ id: result.id }));
        } else {
          this.handleError('delete', result.name || `ID: ${result.id}`, result.error);
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
      return;
    }

    try {
      const fetchedAliases = await window.electronAPI.getAliases();
      this.store.dispatch(LocalAliasesActions.addLocalAliases({aliases: fetchedAliases}));
    } catch (error: any) {
      console.error('AliasService: Error loading aliases:', error);
      this.store.dispatch(LocalAliasesActions.loadLocalAliasesFailed({ error }));
    } finally {
      // this.loadingState.set(false);
    }
  }

  /**
   * Sends a request to the Electron main process to add a new alias.
   */
  addAlias(alias: NewAlias): void {
    console.log('AliasService: Requesting to add alias:', alias);
    if (!window.electronAPI) {
      console.error('AliasService: Electron API is not available.');
      return;
    }

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
    window.electronAPI.deleteAlias(id);
    // Response handled by onDeleteAliasReply listener
  }

  // Helper for error handling (ensure name parameter allows null)
  private handleError(action: string, identifier: string | null, errorMsg?: string): void {
    const message = `Failed to ${action} alias${identifier ? " '" + identifier + "'" : ''}: ${errorMsg || 'Unknown error'}`;
  }

  // --- Add success message handling if using successState signal ---
  private handleSuccess(action: string, identifier: string | null): void {
    const message = `Alias${identifier ? " '" + identifier + "'" : ''} ${action}d successfully!`;
  }

}
