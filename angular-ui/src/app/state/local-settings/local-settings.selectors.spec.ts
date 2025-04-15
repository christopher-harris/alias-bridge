import * as fromLocalSettings from './local-settings.reducer';
import { selectLocalSettingsState } from './local-settings.selectors';

describe('LocalSettings Selectors', () => {
  it('should select the feature state', () => {
    const result = selectLocalSettingsState({
      [fromLocalSettings.localSettingsFeatureKey]: {}
    });

    expect(result).toEqual({});
  });
});
