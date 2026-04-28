import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/services/auth.service';

/** Restricts routes to users with role ADMIN (API must enforce the same rules). */
export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const auth = inject(AuthService);
  return auth.isAdmin()
    ? true
    : router.createUrlTree(['/dashboard']);
};
