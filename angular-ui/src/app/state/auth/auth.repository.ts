import {createStore, select, withProps} from '@ngneat/elf';
import { Injectable } from '@angular/core';
import {Auth, User} from 'firebase/auth';
import {AppUser} from '../../models/app-user.model';
import {Observable} from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AuthProps {
  user: AppUser | null;
}

@Injectable({ providedIn: 'root' })
export class AuthRepository {
  private store = createStore({ name: 'auth' }, withProps<AuthProps>({
    user: null,
  }));

  user$: Observable<AppUser | null> = this.store.pipe(select(state => state.user));

  constructor() {}

  updateUser(user: AppUser | null) {
    this.store.update((state) => ({
      ...state,
      user,
    }))
  }

}
