import { TestBed } from '@angular/core/testing';

import { UserService } from './user';
import { provideFirebaseTestingMocks } from '../testing/firebase-test-providers';

describe('User', () => {
  let service: UserService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideFirebaseTestingMocks()],
    });
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
