import {inject, Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {AliasService} from '../../services/alias.service';
import {LocalAliasesActions} from './local-aliases.actions';
import {exhaustMap, tap} from 'rxjs';
import {Router} from '@angular/router';

@Injectable()
export class LocalAliasesEffects {
  private aliasService = inject(AliasService);
  private actions$ = inject(Actions);
  router = inject(Router);

  loadLocalAliases$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(LocalAliasesActions.loadLocalAliases),
      exhaustMap(action => this.aliasService.loadAliases())
    );
  }, {dispatch: false});

  aliasCreated$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(LocalAliasesActions.userCreatedAlias),
      tap(action => {
        this.aliasService.addAlias(action.alias);
        this.router.navigate(['/']);
      })
    );
  }, {dispatch: false});

  aliasDeleted$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(LocalAliasesActions.deleteLocalAlias),
      tap(action => this.aliasService.deleteAlias(action.id))
    );
  }, {dispatch: false});

  aliasUpdated$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(LocalAliasesActions.updateLocalAlias),
      tap((action) => this.aliasService.updateAlias(action.alias.id, action.alias))
    );
  }, {dispatch: false});

}
