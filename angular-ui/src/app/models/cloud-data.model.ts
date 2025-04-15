import {Alias, AppearanceSetting, PrimeTheme} from '../electron';

export interface CloudData {
  aliases: Alias[];
  uid: string;
  subscription: {status: string;};
  settings: {
    appearance: AppearanceSetting;
    theme: PrimeTheme;
  };
}
