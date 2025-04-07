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
  aliasService = inject(AliasService);
  currentOS = this.aliasService.operatingSystem;
  aliases: Signal<Alias[]> = this.aliasService.aliases;

  currentlyEditingAliasOriginal = signal<Alias | null>(null);

  async loadAliases(): Promise<void> {
    await this.aliasService.loadAliases();
  }

  onRowEditInit(alias: Alias) {
    console.log(alias);
    this.currentlyEditingAliasOriginal.set(alias);
  }

  onRowEditSave(alias: Alias) {
    console.log(alias);
    this.aliasService.updateAlias(alias.id, alias);
    this.currentlyEditingAliasOriginal.set(null);
    this.loadAliases();
  }

  onRowCancelEdit(alias: Alias) {
    console.log(alias);
    this.currentlyEditingAliasOriginal.set(null);
    this.loadAliases();
  }

  onRowDelete(alias: Alias) {
    console.log(alias);
    this.aliasService.deleteAlias(alias.id);
  }
}
