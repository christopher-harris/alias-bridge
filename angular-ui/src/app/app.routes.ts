import { Routes } from '@angular/router';
import {EditAliasComponent} from './components/edit-alias/edit-alias.component';
import {DashboardComponent} from './dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
  },
  {
    path: 'edit-alias',
    component: EditAliasComponent
  },
  {
    path: 'dashboard',
    redirectTo: '',
    pathMatch: 'full',
  }
];
