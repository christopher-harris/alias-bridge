import {ChangeDetectorRef, Component, computed, effect, inject, OnDestroy, OnInit, Signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {usePreset} from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import {SetupInfoComponent} from './components/setup-info/setup-info.component';
import {AliasService} from './services/alias.service';
import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {ToolbarModule} from 'primeng/toolbar';
import {ButtonModule} from 'primeng/button';

interface Alias {
  name: string;
  command: string;
  comment?: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, FormsModule, ReactiveFormsModule, SetupInfoComponent, ToastModule, ToolbarModule, ButtonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [
    MessageService
  ]
})
export class AppComponent implements OnInit, OnDestroy {
  aliasService = inject(AliasService);
  messageService = inject(MessageService);

  aliases: Signal<Alias[]> = this.aliasService.aliases;
  loading: Signal<boolean> = this.aliasService.loading;
  aliasCount = computed(() => this.aliases().length);
  successMessage = this.aliasService.successMessage();

  title = 'AliasBridge UI';
  messageFromMain = 'No reply yet.';

  addStatusMessage = '';

  // Inject ChangeDetectorRef to manually trigger UI updates if needed after IPC calls
  constructor(private cdr: ChangeDetectorRef) {
    effect(() => {
      if (this.successMessage) {
        console.log(this.successMessage);
      }
    });
  }

  async loadAliases(): Promise<void> {
    await this.aliasService.loadAliases();
  }

  async ngOnInit(): Promise<any> {
    console.log('AppComponent initialized.');

    await this.aliasService.loadAliases();

    window.electronAPI.onAddAliasReply((result: any) => {
      console.log('Add Alias Reply:', result);
      if (result.success) {
        this.messageService.add({
          severity: 'success',
          summary: 'Add Alias',
          detail: `Successfully Added Alias: ${result.alias.name}`,
        });
      }
    });

    window.electronAPI.onDeleteAliasReply((result: any) => {
      console.log('Add Alias Reply:', result);
      if (result.success) {
        this.messageService.add({
          severity: 'info',
          summary: 'Remove Alias',
          detail: `Successfully Removed Alias: ${result.name}`,
        })
      }
    });

    // // Example: Listen for replies from the main process
    // window.electronAPI?.onMessageReply((message) => {
    //   console.log('Reply received in renderer:', message);
    //   this.messageFromMain = message;
    //   this.cdr.detectChanges(); // Trigger change detection
    // });
    //
    // // Listen for add alias replies
    // window.electronAPI?.onAddAliasReply((result) => {
    //   console.log('Add Alias Reply:', result);
    //   this.addStatusMessage = result.success
    //     ? `Alias '${result.name}' request sent (implement actual saving!).`
    //     : `Failed to add alias '${result.name}'.`;
    //   if (result.success) {
    //     // Optionally clear form or reload list after successful *request*
    //     this.newAliasName = '';
    //     this.newAliasCommand = '';
    //     this.newAliasComment = '';
    //     this.loadAliases(); // Refresh list to show (dummy) added alias
    //   }
    //   this.cdr.detectChanges();
    //   // Clear message after a few seconds
    //   setTimeout(() => {
    //     this.addStatusMessage = '';
    //     this.cdr.detectChanges();
    //   }, 5000);
    // });
    //
    // // Load initial aliases
    // await this.loadAliases();
  }

  ngOnDestroy(): void {
    // IMPORTANT: Remove listeners when component is destroyed to prevent memory leaks
    window.electronAPI?.removeAllListeners('message-from-main');
    window.electronAPI?.removeAllListeners('add-alias-reply');
  }

  sendMessageToMain(): void {
    const message = 'Hello from Angular!';
    console.log('Sending message to main:', message);
    // Use the exposed API from preload.ts
    window.electronAPI?.sendMessage(message);
  }

}
