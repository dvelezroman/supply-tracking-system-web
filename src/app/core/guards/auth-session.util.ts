import { Router, UrlTree } from '@angular/router';

/** Misma señal que usan el interceptor y los endpoints protegidos. */
export function hasStoredAccessToken(): boolean {
  return typeof localStorage !== 'undefined' &&
    !!localStorage.getItem('access_token');
}

/** Ruta pública: si ya hay token, el destino adecuado es el dashboard. */
export function redirectToDashboardIfAuthed(
  router: Router
): true | UrlTree {
  return hasStoredAccessToken()
    ? router.createUrlTree(['/dashboard'])
    : true;
}
