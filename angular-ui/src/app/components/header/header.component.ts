import {Component, computed, inject, output} from '@angular/core';
import {ButtonModule} from "primeng/button";
import {ToolbarModule} from "primeng/toolbar";
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {localSettingsFeature} from '../../state/local-settings/local-settings.reducer';
import {Store} from '@ngrx/store';
import {SettingsService} from '../../services/settings.service';
import {AliasService} from '../../services/alias.service';
import {CloudStatusComponent} from './cloud-status/cloud-status.component';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    ButtonModule,
    ToolbarModule,
    CloudStatusComponent
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  store = inject(Store);
  settingsService = inject(SettingsService);
  aliasService = inject(AliasService);

  currentPrimeTheme = toSignal(this.store.select(localSettingsFeature.selectCurrentTheme));
  currentAppearance = toSignal(this.store.select(localSettingsFeature.selectCurrentAppearance));
  appearanceToggleIcon = computed(() => this.currentAppearance() === 'dark' ? 'pi pi-sun' : 'pi pi-moon');
  settingsClicked = output();

  async loadAliases(): Promise<void> {
    await this.aliasService.loadAliases();
  }

  handleAppearanceClicked() {
    // console.log(this.activeAppearance());
    if (this.currentAppearance() === 'dark') {
      this.settingsService.setAppearancePreference('light');
    } else {
      this.settingsService.setAppearancePreference('dark');
    }
  }
}
