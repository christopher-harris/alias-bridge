import {ChangeDetectorRef, Component, computed, effect, inject, OnDestroy, OnInit, signal, Signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AliasService} from './services/alias.service';
import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {AppearanceService} from './services/appearance.service';
import {AppearanceSetting, PrimeTheme, UpdateStatus} from './electron';
import {DrawerModule} from 'primeng/drawer';
import {SelectButtonChangeEvent, SelectButtonModule} from 'primeng/selectbutton';
import {UiThemeService} from './services/ui-theme.service';
import {usePreset} from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import Lara from '@primeng/themes/lara';
import Nora from '@primeng/themes/nora';
import Material from '@primeng/themes/material';
import {UpdateService} from './services/update.service';
import {isDevMode} from '@angular/core';
import {MessageModule} from 'primeng/message';

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
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [
    MessageService
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  aliasService = inject(AliasService);
  uiThemeService = inject(UiThemeService);
  messageService = inject(MessageService);
  appearanceService = inject(AppearanceService);
  updateService = inject(UpdateService);
  currentAppearanceSetting: Signal<AppearanceSetting> = this.appearanceService.appearanceSetting;
  activeAppearance = this.appearanceService.activeAppearance;
  appearanceToggleIcon = computed(() => this.activeAppearance() === 'dark' ? 'pi pi-sun' : 'pi pi-moon');
  settingsDrawerVisible = signal<boolean>(false);
  availableAppearanceOptions = this.appearanceService.availableAppearanceSettings;
  availableThemeOptions = this.uiThemeService.availablePrimeThemes;
  currentPrimeTheme = this.uiThemeService.primeTheme;

  aliases: Signal<Alias[]> = this.aliasService.aliases;
  loading: Signal<boolean> = this.aliasService.loading;
  aliasCount = computed(() => this.aliases().length);
  successMessage = this.aliasService.successMessage();

  updateStatus: Signal<UpdateStatus>;
  isUpdateReady: Signal<boolean>;

  isDevMode = isDevMode();

  title = 'AliasBridge UI';
  messageFromMain = 'No reply yet.';

  addStatusMessage = '';

  // Inject ChangeDetectorRef to manually trigger UI updates if needed after IPC calls
  constructor(private cdr: ChangeDetectorRef) {
    effect(() => {
      console.log(this.activeAppearance());
      this.setPrimeTheme(this.currentPrimeTheme());
      if (this.successMessage) {
        console.log(this.successMessage);
      }
    });
    this.updateStatus = this.updateService.updateStatus;
    this.isUpdateReady = this.updateService.isUpdateReady;
  }

  async loadAliases(): Promise<void> {
    await this.aliasService.loadAliases();
  }

  async ngOnInit(): Promise<any> {
    console.log('AppComponent initialized.');

    await this.aliasService.loadAliases();

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
    console.log(theme);
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

  sendMessageToMain(): void {
    const message = 'Hello from Angular!';
    console.log('Sending message to main:', message);
    // Use the exposed API from preload-scripts.entry.ts
    window.electronAPI?.sendMessage(message);
  }

  handleAppearanceClicked() {
    // console.log(this.activeAppearance());
    if (this.activeAppearance() === 'dark') {
      this.appearanceService.setAppearancePreference('light');
    } else {
      this.appearanceService.setAppearancePreference('dark');
    }
  }

  handleSettingsClicked() {
    this.settingsDrawerVisible.set(!this.settingsDrawerVisible());
  }

  handleAppearanceChanged(event: SelectButtonChangeEvent) {
    this.appearanceService.setAppearancePreference(event.value);
  }

  handleThemeChanged(event: SelectButtonChangeEvent) {
    this.uiThemeService.setPrimeThemePreference(event.value);
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

}
