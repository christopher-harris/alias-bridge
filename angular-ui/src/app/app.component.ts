import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  OnDestroy,
  OnInit,
  signal,
  Signal
} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
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
import {select, Store} from '@ngrx/store';
import {LocalSettingsActions} from './state/local-settings/local-settings.actions';
import {localSettingsFeature} from './state/local-settings/local-settings.reducer';
import {UpdateStatusComponent} from './components/update-status/update-status.component';
import {AuthService} from './services/auth.service';
import {HeaderComponent} from './components/header/header.component';
import {ElectronListenerService} from './services/electron-listener.service';
import {AuthActions} from './state/app/auth/auth.actions';
import {Observable} from 'rxjs';
import {AppUser} from './models/app-user.model';
import {selectAppUser} from './state/app/auth/auth.selectors';

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
    HeaderComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [
    MessageService
  ]
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  store = inject(Store);
  messageService = inject(MessageService);
  updateService = inject(UpdateService);
  settingsService = inject(SettingsService);
  authService = inject(AuthService);
  listenerService = inject(ElectronListenerService);

  settingsDrawerVisible = signal<boolean>(false);
  availableAppearanceOptions = this.settingsService.availableAppearanceSettings;
  availableThemeOptions = this.settingsService.availablePrimeThemes;
  currentPrimeTheme = toSignal(this.store.select(localSettingsFeature.selectCurrentTheme));
  currentAppearance = toSignal(this.store.select(localSettingsFeature.selectCurrentAppearance));

  updateStatus: Signal<UpdateStatus>;
  isUpdateReady: Signal<boolean>;

  appUser$: Observable<AppUser | null> = this.store.pipe(select(selectAppUser));

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
    this.listenerService.initListeners();
  }

  async ngOnInit(): Promise<any> {
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
  }

  ngAfterViewInit() {
    // this.listenerService.initListeners();
  }

  ngOnDestroy(): void {
    // IMPORTANT: Remove listeners when component is destroyed to prevent memory leaks
    window.electronAPI?.removeAllListeners('message-from-main');
    window.electronAPI?.removeAllListeners('add-alias-reply');
    window.electronAPI?.removeAllListeners('aliases-updated');
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
    this.store.dispatch(AuthActions.userClickedGitHubAuth());
  }

  logOut(): void {
    this.store.dispatch(AuthActions.userClickedLogOut());
    // this.authService.signOut();
  }

}
