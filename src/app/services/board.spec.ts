import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { BoardService } from './board';
import { AuthService } from './auth';
import { provideFirebaseTestingMocks } from '../testing/firebase-test-providers';

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  provideFirestore: vi.fn(),
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  docData: vi.fn(),
  documentId: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'board-1' }),
  setDoc: vi.fn().mockResolvedValue(undefined),
}));

describe('BoardService', () => {
  let service: BoardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideFirebaseTestingMocks()],
    });
    service = TestBed.inject(BoardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('creates a board without throwing when currentUser has no boards property', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideFirebaseTestingMocks(),
        { provide: AuthService, useValue: { currentUser: signal({ uid: 'u1', name: 'Test' }) } },
      ],
    });
    const boardService = TestBed.inject(BoardService);

    await expect(boardService.createBoard()).resolves.toEqual(
      expect.objectContaining({ id: 'board-1' }),
    );
  });
});
