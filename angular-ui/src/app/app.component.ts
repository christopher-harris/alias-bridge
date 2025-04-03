import {ChangeDetectorRef, Component, computed, inject, OnDestroy, OnInit, Signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {usePreset} from '@primeng/themes';
import Aura from '@primeng/themes/aura';
import {SetupInfoComponent} from './components/setup-info/setup-info.component';
import {AliasService} from './services/alias.service';

interface Alias {
  name: string;
  command: string;
  comment?: string;
}

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, FormsModule, ReactiveFormsModule, SetupInfoComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  aliasService = inject(AliasService);

  aliases: Signal<Alias[]> = this.aliasService.aliases;
  loading: Signal<boolean> = this.aliasService.loading;
  aliasCount = computed(() => this.aliases().length);

  title = 'AliasBridge UI';
  messageFromMain = 'No reply yet.';

  addStatusMessage = '';

  // Inject ChangeDetectorRef to manually trigger UI updates if needed after IPC calls
  constructor(private cdr: ChangeDetectorRef) {
  }

  async ngOnInit(): Promise<any> {
    console.log('AppComponent initialized.');

    await this.aliasService.loadAliases();

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

  // async loadAliases(): Promise<void> {
  //   console.log('Requesting aliases from main process...');
  //   try {
  //     const fetchedAliases = await window.electronAPI?.getAliases();
  //     if (fetchedAliases) {
  //       this.aliases = fetchedAliases;
  //       console.log('Aliases loaded:', this.aliases);
  //       this.cdr.detectChanges(); // Trigger UI update
  //     } else {
  //       console.error('Electron API not available or getAliases returned undefined');
  //       this.aliases = []; // Clear aliases if API is not ready
  //     }
  //
  //   } catch (error) {
  //     console.error('Error loading aliases:', error);
  //     this.aliases = []; // Clear aliases on error
  //     this.cdr.detectChanges();
  //   }
  // }

}
