import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';
import { catchError, throwError } from 'rxjs';
import { SnackbarService } from '../services/snackbar.service';

/** Browser could not complete the request (API down, CORS, etc.). Angular often uses status 0. */
function isNetworkLayerFailure(err: HttpErrorResponse): boolean {
  if (err.status === 0) return true;
  const m = err.message ?? '';
  return m.includes('Http failure response') && m.includes('Unknown Error');
}

function userFacingMessage(err: HttpErrorResponse, t: TranslocoService): string {
  if (isNetworkLayerFailure(err)) {
    return t.translate('errors.apiUnreachable');
  }

  const status = err.status;
  const body = err.error as Record<string, unknown> | undefined;

  // Blob/ArrayBuffer error bodies (e.g. failed PDF download)
  if (err.url?.includes('/qr/pdf') || err.url?.includes('/pdf')) {
    return t.translate('errors.pdfDownloadFailed');
  }

  const raw = body?.['message'];
  if (Array.isArray(raw)) {
    const lines = raw.filter((x): x is string => typeof x === 'string');
    if (lines.length === 1 && lines[0].length <= 160) return lines[0];
    return t.translate('errors.validation');
  }
  if (typeof raw === 'string' && raw.trim()) {
    const msg = raw.trim();
    if (msg.length <= 200) return msg;
    return t.translate('errors.unexpected');
  }

  switch (status) {
    case 400:
      return t.translate('errors.badRequest');
    case 403:
      return t.translate('errors.forbidden');
    case 404:
      return t.translate('errors.notFound');
    case 409:
      return t.translate('errors.conflict');
    case 500:
    case 502:
    case 503:
      return t.translate('errors.server');
    default:
      return t.translate('errors.unexpected');
  }
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const snackbar = inject(SnackbarService);
  const transloco = inject(TranslocoService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        const url = err.url ?? '';
        const isAuthEndpoint =
          url.includes('/auth/login') || url.includes('/auth/register');
        if (isAuthEndpoint) {
          snackbar.error(transloco.translate('errors.loginFailed'));
          return throwError(() => err);
        }
        const hadToken = !!localStorage.getItem('access_token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('current_user');
        snackbar.error(
          transloco.translate(hadToken ? 'errors.session' : 'errors.mustSignIn'),
        );
        router.navigate(['/auth/login']);
        return throwError(() => err);
      }

      snackbar.error(userFacingMessage(err, transloco));
      return throwError(() => err);
    }),
  );
};
