import { createStore } from '@ngneat/elf';
import { withEntities, selectAllEntities, setEntities, addEntities, updateEntities, deleteEntities } from '@ngneat/elf-entities';
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import {Alias} from '../electron';

@Injectable({ providedIn: 'root' })
export class LocalAliasesRepository {
  private store = createStore({ name: 'localAliases' }, withEntities<Alias>());

  localAliases$: Observable<Alias[]> = this.store.pipe(selectAllEntities());

  setLocalAliases(localAliases: Alias[]) {
    this.store.update(setEntities(localAliases));
  }

  addLocalAlias(localAlias: Alias) {
    this.store.update(addEntities(localAlias));
  }

  updateLocalAlias(id: Alias['id'], localAlias: Partial<Alias>) {
    this.store.update(updateEntities(id, localAlias));
  }

  deleteLocalAlias(id: Alias['id']) {
    this.store.update(deleteEntities(id));
  }
}
