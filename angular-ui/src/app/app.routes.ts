import { Routes } from '@angular/router';
import {AddAliasComponent} from './components/add-alias/add-alias.component';
import {DashboardComponent} from './dashboard/dashboard.component';

export const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
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
