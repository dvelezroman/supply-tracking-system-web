import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);

  getTranslation(lang: string): Observable<Translation> {
    // Cache-bust so new i18n keys (e.g. publicTrace.searchAnotherLot) appear after deploy
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`, {
      params: { v: '20260825' },
    });
  }
}
