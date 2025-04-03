import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PanelModule} from 'primeng/panel';
import {ButtonModule} from 'primeng/button';
import {Clipboard, ClipboardModule} from '@angular/cdk/clipboard';
import {ToastModule} from 'primeng/toast';
import {MessageService} from 'primeng/api';

@Component({
  selector: 'app-darwin-setup-instructions',
  imports: [
    CommonModule,
    PanelModule,
    ButtonModule,
    ClipboardModule,
    ToastModule,
  ],
  templateUrl: './darwin-setup-instructions.component.html',
  styleUrl: './darwin-setup-instructions.component.scss',
  providers: [
    MessageService,
  ]
})
export class DarwinSetupInstructionsComponent {
  clipboard = inject(Clipboard);
  messageService = inject(MessageService);
  aliasConnectorText = `# Load AliasBridge Aliases
if [ -f ~/.alias_bridge_aliases.sh ]; then
  source ~/.alias_bridge_aliases.sh
fi`;

  handleCopyToClipboardComplete() {
    console.log('Copied to clipboard');
    this.messageService.add({
      severity: 'success',
      summary: 'Copied to clipboard'
    })
  }
}
