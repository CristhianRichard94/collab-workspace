import { TestBed } from '@angular/core/testing';

import { UserService } from './user';
import { UserBoardAccessType } from '../types/user';
import { provideFirebaseTestingMocks } from '../testing/firebase-test-providers';

const getDocsMock = vi.fn();
const whereMock = vi.fn();
const queryMock = vi.fn();

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  provideFirestore: vi.fn(),
  getFirestore: vi.fn(),
  collection: vi.fn(),
  documentId: vi.fn(),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
}));

describe('User', () => {
  let service: UserService;

  beforeEach(() => {
    getDocsMock.mockReset().mockResolvedValue({ forEach: vi.fn() });
    TestBed.configureTestingModule({
      providers: [provideFirebaseTestingMocks()],
    });
    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('queries users by contributors map keys', async () => {
    await service.getContributors({
      'uid-1': UserBoardAccessType.ADMIN,
      'uid-2': UserBoardAccessType.WRITE,
    });

    expect(whereMock).toHaveBeenCalledWith(undefined, 'in', ['uid-1', 'uid-2']);
    expect(getDocsMock).toHaveBeenCalled();
  });

  it('returns an empty result without querying Firestore for an empty contributors map', async () => {
    const result = await service.getContributors({});

    expect(getDocsMock).not.toHaveBeenCalled();
    expect(() => result.forEach(() => {})).not.toThrow();
  });
});
