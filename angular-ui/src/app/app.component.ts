import {ChangeDetectorRef, Component, computed, effect, inject, OnDestroy, OnInit, signal, Signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AliasService} from './services/alias.service';
import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {PrimeTheme, UpdateStatus} from './electron';
import {DrawerModule} from 'primeng/drawer';
import {SelectButtonChangeEvent, SelectButtonModule} from 'primeng/selectbutton';
import {usePreset} from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import Lara from '@primeng/themes/lara';
import Nora from '@primeng/themes/nora';
import Material from '@primeng/themes/material';
import {UpdateService} from './services/update.service';
import {MessageModule} from 'primeng/message';
import {SettingsService} from './services/settings.service';
import {toSignal} from '@angular/core/rxjs-interop';
import {Store} from '@ngrx/store';
import {LocalSettingsActions} from './state/local-settings/local-settings.actions';
import {localSettingsFeature} from './state/local-settings/local-settings.reducer';
import {CloudDataActions} from './state/cloud-data/cloud-data.actions';
import {UpdateStatusComponent} from './components/update-status/update-status.component';
import {AuthService} from './services/auth.service';
import {cloudDataFeature} from './state/cloud-data/cloud-data.reducer';

interface Alias {
  name: string;
  command: string;
  comment?: string;
}

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    ToolbarModule,
    ButtonModule,
    DrawerModule,
    SelectButtonModule,
    MessageModule,
    UpdateStatusComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [
    MessageService
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  store = inject(Store);
  aliasService = inject(AliasService);
  messageService = inject(MessageService);
  updateService = inject(UpdateService);
  settingsService = inject(SettingsService);
  authService = inject(AuthService);

  settingsDrawerVisible = signal<boolean>(false);
  availableAppearanceOptions = this.settingsService.availableAppearanceSettings;
  availableThemeOptions = this.settingsService.availablePrimeThemes;
  currentPrimeTheme = toSignal(this.store.select(localSettingsFeature.selectCurrentTheme));
  currentAppearance = toSignal(this.store.select(localSettingsFeature.selectCurrentAppearance));
  appearanceToggleIcon = computed(() => this.currentAppearance() === 'dark' ? 'pi pi-sun' : 'pi pi-moon');

  updateStatus: Signal<UpdateStatus>;
  isUpdateReady: Signal<boolean>;

  title = 'AliasBridge UI';

  addStatusMessage = '';

  // Inject ChangeDetectorRef to manually trigger UI updates if needed after IPC calls
  constructor(private cdr: ChangeDetectorRef) {
    this.store.dispatch(LocalSettingsActions.loadLocalSettings());
    effect(() => {
      this.setPrimeTheme(this.currentPrimeTheme()!);
    });
    this.updateStatus = this.updateService.updateStatus;
    this.isUpdateReady = this.updateService.isUpdateReady;
    this.store.select(cloudDataFeature.selectAppUser).subscribe(x => console.log(x));
  }

  async loadAliases(): Promise<void> {
    await this.aliasService.loadAliases();
  }

  async ngOnInit(): Promise<any> {
    console.log('AppComponent initialized.');

    window.electronAPI.onAddAliasReply((result: any) => {
      console.log('Add Alias Reply:', result);
      if (result.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Add Alias',
          detail: `Successfully Added Alias: ${result.alias.name}`,
        });
      }
    });

    window.electronAPI.onDeleteAliasReply((result: any) => {
      console.log('Add Alias Reply:', result);
      if (result.success) {
        this.messageService.add({
          severity: 'info',
          summary: 'Remove Alias',
          detail: `Successfully Removed Alias: ${result.name}`,
        })
      }
    });

    window.electronAPI.onUpdaterStatus((result: any) => {
      console.log('UpdaterStatus: ', result);
    });

    // // Example: Listen for replies from the main process
    // window.electronAPI?.onMessageReply((message) => {
    //   console.log('Reply received in renderer:', message);
    //   this.messageFromMain = message;
    //   this.cdr.detectChanges(); // Trigger change detection
    // });
    //
    // // Listen for add alias replies
    // window.electronAPI?.onAddAliasReply((result) => {
    //   console.log('Add Alias Reply:', result);
    //   this.addStatusMessage = result.success
    //     ? `Alias '${result.name}' request sent (implement actual saving!).`
    //     : `Failed to add alias '${result.name}'.`;
    //   if (result.success) {
    //     // Optionally clear form or reload list after successful *request*
    //     this.newAliasName = '';
    //     this.newAliasCommand = '';
    //     this.newAliasComment = '';
    //     this.loadAliases(); // Refresh list to show (dummy) added alias
    //   }
    //   this.cdr.detectChanges();
    //   // Clear message after a few seconds
    //   setTimeout(() => {
    //     this.addStatusMessage = '';
    //     this.cdr.detectChanges();
    //   }, 5000);
    // });
    //
    // // Load initial aliases
    // await this.loadAliases();
  }

  ngOnDestroy(): void {
    // IMPORTANT: Remove listeners when component is destroyed to prevent memory leaks
    window.electronAPI?.removeAllListeners('message-from-main');
    window.electronAPI?.removeAllListeners('add-alias-reply');
  }

  setPrimeTheme(theme: PrimeTheme) {
    // console.log(theme);
    switch (theme) {
      case 'aura':
        usePreset(Aura);
        break;
      case 'lara':
        usePreset(Lara);
        break;
      case 'nora':
        usePreset(Nora);
        break;
      case 'material':
        usePreset(Material);
        break;
      default:
        usePreset(Aura);
        break;
    }
  }

  handleAppearanceClicked() {
    // console.log(this.activeAppearance());
    if (this.currentAppearance() === 'dark') {
      this.settingsService.setAppearancePreference('light');
    } else {
      this.settingsService.setAppearancePreference('dark');
    }
  }

  handleSettingsClicked() {
    this.settingsDrawerVisible.set(!this.settingsDrawerVisible());
  }

  handleAppearanceChanged(event: SelectButtonChangeEvent) {
    this.settingsService.setAppearancePreference(event.value);
  }

  handleThemeChanged(event: SelectButtonChangeEvent) {
    this.store.dispatch(LocalSettingsActions.updateTheme({ theme: event.value }));
    this.settingsService.setPrimeThemePreference(event.value);
    this.setPrimeTheme(event.value);
  }

  manualCheckForUpdates(): void {
    this.updateService.checkUpdates();
    // if (!isDevMode) {
    //   this.updateService.checkUpdates();
    // }
  }

  restartAndInstall(): void {
    this.updateService.installUpdate();
  }

  handleUserClickedGithubLogin() {
    // this.store.dispatch(CloudDataActions.loginUser());
    this.authService.signInWithGitHub();
  }

}
