import {ChangeDetectorRef, Component, inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PanelModule} from 'primeng/panel';
import {WindowsSetupInstructionsComponent} from './windows-setup-instructions/windows-setup-instructions.component';
import {DarwinSetupInstructionsComponent} from './darwin-setup-instructions/darwin-setup-instructions.component';

@Component({
  selector: 'app-setup-info',
  imports: [
    CommonModule,
    PanelModule,
    WindowsSetupInstructionsComponent,
    DarwinSetupInstructionsComponent,
  ],
  templateUrl: './setup-info.component.html',
  styleUrl: './setup-info.component.scss'
})
export class SetupInfoComponent implements OnInit {
  currentOS: string = 'unknown';
  cdr = inject(ChangeDetectorRef);

  async ngOnInit(): Promise<void> {
    try {
      this.currentOS = await window.electronAPI?.getOSPlatform() || 'unknown';
      // this.currentOS = 'win32';
      // console.log('Detected OS: ', this.currentOS);
      this.cdr.detectChanges();
    } catch (error) {
      // console.error(error);
      this.currentOS = 'error';
    }
  }
}
