import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for the Firebase auth state to settle (page refresh / direct
  // navigation runs this guard before the async session restore resolves)
  // before deciding whether to allow or redirect.
  return toObservable(authService.authReady).pipe(
    filter((ready) => ready),
    take(1),
    map(() => {
      if (authService.uid()) return true;
      const urlTree = router.parseUrl('/login');
      urlTree.queryParams = { redirectTo: state.url };
      return urlTree;
    }),
  );
};
