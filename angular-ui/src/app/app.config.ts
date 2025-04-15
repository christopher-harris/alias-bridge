import {ApplicationConfig, provideZoneChangeDetection, isDevMode} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {providePrimeNG} from 'primeng/config';
import {provideStore} from '@ngrx/store';
import {provideStoreDevtools} from '@ngrx/store-devtools';
import {provideEffects} from '@ngrx/effects';
import {LocalAliasesEffects} from './state/local-aliases/local-aliases.effects';
import {CloudDataEffects} from './state/cloud-data/cloud-data.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        options: {
          darkModeSelector: '.theme-dark',
          inputVariant: 'outline',
        }
      }
    }),
    provideStore(),
    provideStoreDevtools({maxAge: 25, logOnly: !isDevMode(), connectInZone: true}),
    provideEffects(LocalAliasesEffects, CloudDataEffects)
  ]
};
