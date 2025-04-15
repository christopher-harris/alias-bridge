import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import {Alias, NewAlias} from '../../electron';

export const LocalAliasesActions = createActionGroup({
  source: 'LocalAliases/API',
  events: {
    'Load LocalAliases': emptyProps(),
    'Load Local Aliases Failed': props<{error: any}>(),
    'User Created Alias': props<{ alias: NewAlias }>(),
    'Add LocalAlias': props<{ alias: Alias }>(),
    'Add Local Alias Failed': props<{ error: string }>(),
    'Upsert LocalAlias': props<{ alias: Alias }>(),
    'Add LocalAliases': props<{ aliases: Alias[] }>(),
    'Upsert LocalAliases': props<{ localAliases: Alias[] }>(),
    'Update LocalAlias': props<{ alias: Update<Alias> }>(),
    'Update LocalAliases': props<{ localAliases: Update<Alias>[] }>(),
    'Delete LocalAlias': props<{ id: string }>(),
    'Local Alias Deleted': props<{ id: string }>(),
    'Delete LocalAliases': props<{ ids: string[] }>(),
    'Clear LocalAliases': emptyProps(),
  }
});
