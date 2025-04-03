import {Component, inject, Signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';
import {AliasService} from '../services/alias.service';
import {Alias} from '../electron';
import {RouterModule} from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    ToolbarModule,
    ButtonModule,
    RouterModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  aliasService = inject(AliasService);
  currentOS = this.aliasService.operatingSystem;
  aliases: Signal<Alias[]> = this.aliasService.aliases;
}
