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
    } else if (
      typeof navigator !== 'undefined' &&
      navigator.language?.toLowerCase().startsWith('es')
    ) {
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
