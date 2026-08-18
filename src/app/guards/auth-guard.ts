import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for the Firebase auth state to settle (page refresh / direct
  // navigation runs this guard before the async session restore resolves)
  // before deciding whether to allow or redirect.
  return toObservable(authService.authReady).pipe(
    filter((ready) => ready),
    take(1),
    map(() => (authService.uid() ? true : router.parseUrl('/login'))),
  );
};
