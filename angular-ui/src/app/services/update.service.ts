import {Injectable, NgZone, OnDestroy, Signal, signal, WritableSignal} from '@angular/core';
import {UpdateStatus} from '../electron';

@Injectable({
  providedIn: 'root'
})
export class UpdateService implements OnDestroy {

  // --- State Signals ---
  private statusState: WritableSignal<UpdateStatus> = signal({ status: 'not-available', message: 'Ready' });
  public readonly updateStatus: Signal<UpdateStatus> = this.statusState.asReadonly();

  // Signal to indicate if an update is downloaded and ready to install
  public readonly isUpdateReady = signal<boolean>(false);

  constructor(private ngZone: NgZone) {
    this.setupListeners();
  }

  ngOnDestroy(): void {
    window.electronAPI?.removeAllListeners('updater:status');
  }

  private setupListeners(): void {
    if (!window.electronAPI) { return; }

    window.electronAPI.onUpdaterStatus((statusInfo: UpdateStatus) => {
      this.ngZone.run(() => {
        console.log('UpdateService: Received status:', statusInfo);
        this.statusState.set(statusInfo);
        // Update the ready flag
        this.isUpdateReady.set(statusInfo.status === 'downloaded');
      });
    });
  }

  /** Triggers the backend to check for updates. */
  checkUpdates(): void {
    console.log('UpdateService: Requesting update check...');
    if (!window.electronAPI) {
      this.statusState.set({ status: 'error', message: 'Cannot check: API unavailable.' });
      return;
    }
    // Reset status slightly before check
    this.statusState.set({ status: 'checking', message: 'Checking for update...' });
    this.isUpdateReady.set(false);
    window.electronAPI.checkForUpdates();
  }

  /** Triggers the backend to quit and install the downloaded update. */
  installUpdate(): void {
    console.log('UpdateService: Requesting install update...');
    if (!window.electronAPI) {
      this.statusState.set({ status: 'error', message: 'Cannot install: API unavailable.' });
      return;
    }
    window.electronAPI.installUpdate();
    // App should quit shortly after this call
  }
}
