import {Component, inject, input, signal} from '@angular/core';
import {UpdateStatus} from '../../electron';
import {MessageModule} from 'primeng/message';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {UpdateService} from '../../services/update.service';

@Component({
  selector: 'app-update-status',
  imports: [
    CommonModule,
    MessageModule,
    ButtonModule,
  ],
  templateUrl: './update-status.component.html',
  styleUrl: './update-status.component.scss'
})
export class UpdateStatusComponent {
  updateStatus = input.required<UpdateStatus>();
  updateService = inject(UpdateService);

  manualCheckForUpdates(): void {
    this.updateService.checkUpdates();
    // if (!isDevMode) {
    //   this.updateService.checkUpdates();
    // }
  }
}
