import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth';
import { provideFirebaseTestingMocks } from '../testing/firebase-test-providers';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideFirebaseTestingMocks()],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('exposes currentUser as falsy when there is no authenticated user', async () => {
    // Server-platform mock means firebaseUser resolves to null, so the
    // Firestore resource loader short-circuits to undefined without ever
    // touching Firestore.
    expect(service.uid()).toBeNull();
    await vi.waitFor(() => {
      TestBed.tick();
      expect(service.currentUser()).toBeFalsy();
    });
  });
});
