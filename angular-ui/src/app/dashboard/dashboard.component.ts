import {Component, inject, signal, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {AliasService} from '../services/alias.service';
import {Alias} from '../electron';
import {RouterModule} from '@angular/router';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SetupInfoComponent} from '../components/setup-info/setup-info.component';
import {LocalAliasesRepository} from '../state/local-aliases.repository';
import {Store} from '@ngrx/store';
import {localAliasesFeature} from '../state/local-aliases/local-aliases.reducer';
import {LocalAliasesActions} from '../state/local-aliases/local-aliases.actions';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    ToolbarModule,
    ButtonModule,
    RouterModule,
    TableModule,
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    SetupInfoComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  store = inject(Store);
  aliasService = inject(AliasService);
  localAliasesStore = inject(LocalAliasesRepository);
  aliases = signal<Alias[]>([]);

  constructor() {
    this.store.select(localAliasesFeature.selectAll).subscribe(entities => this.aliases.set(entities));
    this.loadAliases();
  }

  currentlyEditingAliasOriginal = signal<Alias | null>(null);

  async loadAliases(): Promise<void> {
    // await this.aliasService.loadAliases();
    this.store.dispatch(LocalAliasesActions.loadLocalAliases());
  }

  onRowEditInit(alias: Alias) {
    console.log(alias);
    this.currentlyEditingAliasOriginal.set(alias);
  }

  onRowEditSave(alias: Alias) {
    console.log(alias);
    this.aliasService.updateAlias(alias.id, alias);
    // this.store.dispatch(LocalAliasesActions.updateLocalAlias({ alias }));
    this.currentlyEditingAliasOriginal.set(null);
  }

  onRowCancelEdit(alias: Alias) {
    console.log(alias);
    this.currentlyEditingAliasOriginal.set(null);
    this.loadAliases();
  }

  onRowDelete(alias: Alias) {
    console.log(alias);
    // this.aliasService.deleteAlias(alias.id);
    this.store.dispatch(LocalAliasesActions.deleteLocalAlias({ id: alias.id }));
  }
}
