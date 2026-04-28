import { TranslocoService } from '@jsverse/transloco';
import { Title } from '@angular/platform-browser';
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
): () => void {
  return () => {
    const initial = readInitialLang();
    transloco.setActiveLang(initial);
    setCookie(PREF_LANG_COOKIE, transloco.getActiveLang());

    const applyTitle = () => {
      title.setTitle(transloco.translate('app.documentTitle'));
    };
    applyTitle();
    document.documentElement.lang = transloco.getActiveLang();

    transloco.langChanges$.subscribe((lang) => {
      setCookie(PREF_LANG_COOKIE, lang);
      document.documentElement.lang = lang;
      applyTitle();
    });
  };
}
