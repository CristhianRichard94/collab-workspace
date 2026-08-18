import { PLATFORM_ID, Provider } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';

/**
 * Test providers that stub Firebase Auth/Firestore and force the "server"
 * platform so services never touch the real Firebase SDK during unit tests
 * (e.g. `AuthService`/`Login` skip their `isPlatformBrowser` branches that
 * call into `user()`/`onIdTokenChanged`).
 */
export function provideFirebaseTestingMocks(): Provider[] {
  return [
    { provide: PLATFORM_ID, useValue: 'server' },
    { provide: Auth, useValue: {} },
    { provide: Firestore, useValue: {} },
  ];
}
