import {inject, Injectable} from '@angular/core';
import {AliasService} from './alias.service';

@Injectable({
  providedIn: 'root'
})
export class ElectronListenerService {
  private listenersRegistered = false;

  aliasService = inject(AliasService);

  initListeners(): void {
    if (this.listenersRegistered) return;

    window.electronAPI?.removeAllListeners('aliases-updated');

    window.electronAPI.onAliasesUpdated((result: any) => {
      console.log('Aliases Updated:', result);
    });

    this.listenersRegistered = true;
  }

}
