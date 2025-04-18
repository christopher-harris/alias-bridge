import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {AppUser} from '../../../models/app-user.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'User Clicked GitHub Auth': emptyProps(),
    'GitHub Auth Success': props<{ data: AppUser }>(),
    'GitHub Auth Failure': props<{ error: unknown }>(),
    'User Logged Out': emptyProps(),
    'User Clicked Log Out': emptyProps(),
  }
});
