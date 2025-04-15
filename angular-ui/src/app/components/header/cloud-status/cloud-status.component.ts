import {Component, inject} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppUser} from '../../../models/app-user.model';
import {Observable} from 'rxjs';
import {cloudDataFeature} from '../../../state/cloud-data/cloud-data.reducer';
import {NgIcon, provideIcons} from '@ng-icons/core';
import {tablerCloud, tablerCloudOff, tablerCloudNetwork} from '@ng-icons/tabler-icons';
import {ButtonModule} from 'primeng/button';
import {AsyncPipe} from '@angular/common';
import {TooltipModule} from 'primeng/tooltip';

@Component({
  selector: 'app-cloud-status',
  imports: [
    NgIcon,
    ButtonModule,
    AsyncPipe,
    TooltipModule,
  ],
  templateUrl: './cloud-status.component.html',
  styleUrl: './cloud-status.component.scss',
  viewProviders: [
    provideIcons({tablerCloud, tablerCloudOff, tablerCloudNetwork})
  ]
})
export class CloudStatusComponent {
  store = inject(Store);
  appUser$: Observable<AppUser | null> = this.store.select(cloudDataFeature.selectAppUser);
  syncingData$: Observable<boolean> = this.store.select(cloudDataFeature.selectSyncing);
}
