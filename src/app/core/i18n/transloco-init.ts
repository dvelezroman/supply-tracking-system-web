import { TranslocoService } from '@jsverse/transloco';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { skip } from 'rxjs/operators';
import {
  LEGACY_LANG_STORAGE_KEY,
  PREF_LANG_COOKIE,
} from '../preferences/preference-cookies';
import { getCookie, setCookie } from '../utils/cookie.util';

function readInitialLang(): 'es' | 'en' {
  const fromCookie = getCookie(PREF_LANG_COOKIE);
  if (fromCookie === 'es' || fromCookie === 'en') {
    return fromCookie;
  }
  const legacy = localStorage.getItem(LEGACY_LANG_STORAGE_KEY);
  if (legacy === 'es' || legacy === 'en') {
    setCookie(PREF_LANG_COOKIE, legacy);
    localStorage.removeItem(LEGACY_LANG_STORAGE_KEY);
    return legacy;
  }
  return 'es';
}

export function translocoAppInit(
  transloco: TranslocoService,
  title: Title,
): () => Promise<void> {
  return async () => {
    const initial = readInitialLang();
    transloco.setActiveLang(initial);
    setCookie(PREF_LANG_COOKIE, transloco.getActiveLang());

    const applyTitle = () => {
      title.setTitle(transloco.translate('app.documentTitle'));
    };

    await firstValueFrom(transloco.load(initial));
    applyTitle();
    document.documentElement.lang = transloco.getActiveLang();

    transloco.langChanges$.pipe(skip(1)).subscribe((lang) => {
      setCookie(PREF_LANG_COOKIE, lang);
      document.documentElement.lang = lang;
      transloco.load(lang).subscribe(() => applyTitle());
    });
  };
}
