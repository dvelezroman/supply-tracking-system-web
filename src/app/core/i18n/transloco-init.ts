import { TranslocoService } from '@jsverse/transloco';
import { Title } from '@angular/platform-browser';

const LANG_KEY = 'lang';

export function translocoAppInit(
  transloco: TranslocoService,
  title: Title,
): () => void {
  return () => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'es' || saved === 'en') {
      transloco.setActiveLang(saved);
    } else {
      // Default UI language: Spanish (first visit or cleared storage).
      transloco.setActiveLang('es');
    }

    const applyTitle = () => {
      title.setTitle(transloco.translate('app.documentTitle'));
    };
    applyTitle();
    document.documentElement.lang = transloco.getActiveLang();

    transloco.langChanges$.subscribe((lang) => {
      localStorage.setItem(LANG_KEY, lang);
      document.documentElement.lang = lang;
      applyTitle();
    });
  };
}
