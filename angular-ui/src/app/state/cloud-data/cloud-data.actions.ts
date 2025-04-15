import {createActionGroup, emptyProps, props} from '@ngrx/store';
import {AppUser} from '../../models/app-user.model';
import {CloudData} from '../../models/cloud-data.model';
import {Alias, AppearanceSetting, PrimeTheme} from '../../electron';

export const CloudDataActions = createActionGroup({
  source: 'CloudData/API',
  events: {
    'Login User': emptyProps(),
    'User Logged In Success': props<{ data: AppUser }>(),
    'User Cloud Data Loaded': props<{ data: CloudData }>(),
    'User Cloud Data Fetch Failed': props<{ error: any }>(),
    'Save Cloud Aliases': emptyProps(),
    'Save Cloud Aliases Success': props<{ data: Alias[] }>(),
    'Save Cloud Aliases Failure': props<{ error: any }>(),
    'Update Aliases': props<{ data: Alias[] }>(),
    'Update Settings': props<{
      data: {
        appearance: AppearanceSetting;
        theme: PrimeTheme;
      }
    }>(),
    'User Logged Out': emptyProps(),
  }
});
