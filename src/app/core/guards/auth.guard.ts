import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { hasStoredAccessToken } from './auth-session.util';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  return hasStoredAccessToken()
    ? true
    : router.createUrlTree(['/auth/login']);
};
