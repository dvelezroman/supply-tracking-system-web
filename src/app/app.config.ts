import { APP_INITIALIZER, ApplicationConfig, isDevMode } from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
} from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideTransloco } from '@jsverse/transloco';
import { TranslocoService } from '@jsverse/transloco';
import { Title } from '@angular/platform-browser';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { TranslocoHttpLoader } from './core/i18n/transloco-http.loader';
import { translocoAppInit } from './core/i18n/transloco-init';
import { ThemeService } from './core/services/theme.service';
import { themeAppInit } from './core/theme/theme-init';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideAnimations(),
    provideTransloco({
      config: {
        availableLangs: ['es', 'en'],
        defaultLang: 'es',
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: translocoAppInit,
      deps: [TranslocoService, Title],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: themeAppInit,
      deps: [ThemeService],
      multi: true,
    },
  ],
};
