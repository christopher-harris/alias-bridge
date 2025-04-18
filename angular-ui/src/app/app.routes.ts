import { Routes } from '@angular/router';
import {AddAliasComponent} from './components/add-alias/add-alias.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {provideState} from '@ngrx/store';
import {localAliasesFeature, localAliasesFeatureKey} from './state/local-aliases/local-aliases.reducer';
import {localSettingsFeature, localSettingsFeatureKey} from './state/local-settings/local-settings.reducer';
export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    providers: [
      provideState({ name: localAliasesFeatureKey, reducer: localAliasesFeature.reducer }),
      provideState({ name: localSettingsFeatureKey, reducer: localSettingsFeature.reducer }),
    ]
  },
  {
    path: 'add-alias',
    component: AddAliasComponent
  },
  {
    path: 'dashboard',
    redirectTo: '',
    pathMatch: 'full',
  }
];
