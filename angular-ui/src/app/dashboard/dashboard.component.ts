import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {AliasService} from '../services/alias.service';
import {Alias} from '../electron';
import {RouterModule} from '@angular/router';
import {TableModule} from 'primeng/table';
import {InputTextModule} from 'primeng/inputtext';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SetupInfoComponent} from '../components/setup-info/setup-info.component';
import {select, Store} from '@ngrx/store';
import {localAliasesFeature} from '../state/local-aliases/local-aliases.reducer';
import {LocalAliasesActions} from '../state/local-aliases/local-aliases.actions';
import {Observable} from 'rxjs';
import {selectLocalAliases} from '../state/local-aliases/local-aliases.selectors';

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
  aliases = signal<Alias[]>([]);
  aliases$: Observable<Alias[]> = this.store.pipe(select(localAliasesFeature.selectAll));

  constructor() {
    this.loadAliases();
    this.aliases$.subscribe(aliases => {
      console.log('Aliases:', aliases);
      this.aliases.set(aliases);
    });
  }

  currentlyEditingAliasOriginal = signal<Alias | null>(null);
  currentlyEditingAliasForm: FormGroup = new FormGroup({
    id: new FormControl(''),
    name: new FormControl(''),
    command: new FormControl(''),
    comment: new FormControl(''),
    created: new FormControl(''),
    lastUpdated: new FormControl(''),
  });

  async loadAliases(): Promise<void> {
    // await this.aliasService.loadAliases();
    this.store.dispatch(LocalAliasesActions.loadLocalAliases());
  }

  onRowEditInit(alias: Alias) {
    this.currentlyEditingAliasForm.patchValue(alias);
    this.currentlyEditingAliasOriginal.set(alias);
  }

  onRowEditSave() {
    console.log(this.currentlyEditingAliasForm.value);
    if (this.currentlyEditingAliasForm.valid) {
      // this.aliasService.updateAlias(this.currentlyEditingAliasForm.value.id, this.currentlyEditingAliasForm.value);
      this.store.dispatch(LocalAliasesActions.updateLocalAlias({alias: this.currentlyEditingAliasForm.value}));
      this.currentlyEditingAliasForm.reset();
      this.currentlyEditingAliasOriginal.set(null);
    }
  }

  onRowCancelEdit(alias: Alias) {
    console.log(alias);
    this.currentlyEditingAliasForm.reset();
    this.currentlyEditingAliasOriginal.set(null);
    this.loadAliases();
  }

  onRowDelete(alias: Alias) {
    console.log(alias);
    // this.aliasService.deleteAlias(alias.id);
    this.store.dispatch(LocalAliasesActions.deleteLocalAlias({ id: alias.id }));
  }
}
