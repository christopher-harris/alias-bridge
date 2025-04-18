import {inject, Injectable} from '@angular/core';
import {AliasService} from './alias.service';
import {Store} from '@ngrx/store';
import {LocalAliasesActions} from '../state/local-aliases/local-aliases.actions';
import {AuthActions} from '../state/app/auth/auth.actions';

@Injectable({
  providedIn: 'root'
})
export class ElectronListenerService {
  store = inject(Store);

  private listenersRegistered = false;

  aliasService = inject(AliasService);

  initListeners(): void {
    if (this.listenersRegistered) return;

    window.electronAPI?.removeAllListeners('aliases-updated');

    window.electronAPI.onAliasesUpdated((result: any) => {
      console.log('Aliases Updated:', result);
      this.store.dispatch(LocalAliasesActions.updateLocalAliases({aliases: result}));
    });

    window.electronAPI.onLogOutSuccess(() => {
      console.log('Log Out Success');
      this.store.dispatch(AuthActions.userLoggedOut());
    });

    this.listenersRegistered = true;
  }

}
