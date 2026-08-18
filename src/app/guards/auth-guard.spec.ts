import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { firstValueFrom, isObservable, Observable } from 'rxjs';

import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  function setup(authReadyValue: boolean, uidValue: string | null) {
    const authReady = signal(authReadyValue);
    const uid = signal(uidValue);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthService,
          useValue: { authReady, uid },
        },
      ],
    });

    return { authReady, uid };
  }

  it('allows navigation once auth state is ready and a user is signed in', async () => {
    setup(true, 'user-123');

    const result = executeGuard({} as never, {} as never);
    const value = isObservable(result) ? await firstValueFrom(result as Observable<boolean | UrlTree>) : result;

    expect(value).toBe(true);
  });

  it('redirects to /login with a UrlTree when auth state is ready and no user is signed in', async () => {
    setup(true, null);
    const router = TestBed.inject(Router);
    const parseUrlSpy = vi.spyOn(router, 'parseUrl');

    const result = executeGuard({} as never, {} as never);
    const value = isObservable(result) ? await firstValueFrom(result as Observable<boolean | UrlTree>) : result;

    expect(value).toBeInstanceOf(UrlTree);
    expect(parseUrlSpy).toHaveBeenCalledWith('/login');
  });

  it('waits for auth state to settle before deciding, instead of prematurely redirecting', async () => {
    const { authReady, uid } = setup(false, null);

    const result$ = executeGuard({} as never, {} as never) as Observable<boolean | UrlTree>;
    let resolved: boolean | UrlTree | undefined;
    const sub = result$.subscribe((value) => (resolved = value));

    // Still loading: guard must not have decided yet.
    expect(resolved).toBeUndefined();

    // Auth state settles with a logged-in user.
    uid.set('user-123');
    authReady.set(true);
    TestBed.tick();

    await Promise.resolve();
    expect(resolved).toBe(true);

    sub.unsubscribe();
  });
});
