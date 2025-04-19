import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {AppUser} from '../../../models/app-user.model';

export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    'User Clicked GitHub Auth': emptyProps(),
    'Auth Success': props<{ data: AppUser }>(),
    'GitHub Auth Failure': props<{ error: unknown }>(),
    'User Logged Out': emptyProps(),
    'User Clicked Log Out': emptyProps(),
    'Register Email User': props<{email: string, password: string}>(),
    'Register Email User Success': props<{data: AppUser}>(),
    'Register Email User Failed': props<{error: any}>(),
    'Sign In Email User': props<{email: string, password: string}>(),
    'Sign In Email User Success': props<{data: AppUser}>(),
    'Sign In Email User Failed': props<{error: any}>(),
  }
});
