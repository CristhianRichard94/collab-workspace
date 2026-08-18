import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { BoardService } from './board';
import { AuthService } from './auth';
import { UserBoardAccessType } from '../types/user';
import { provideFirebaseTestingMocks } from '../testing/firebase-test-providers';

function firestoreError(code: string) {
  return Object.assign(new Error(code), { code });
}

const updateDocMock = vi.fn().mockResolvedValue(undefined);
const getDocMock = vi.fn();
const setDocMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@angular/fire/firestore', () => ({
  Firestore: class {},
  provideFirestore: vi.fn(),
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  docData: vi.fn(),
  documentId: vi.fn(),
  getDocs: vi.fn(),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  query: vi.fn(),
  where: vi.fn(),
  addDoc: vi.fn().mockResolvedValue({ id: 'board-1' }),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
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

  describe('joinBoard', () => {
    function setupWithUser(uid: string, boards: Array<{ id: string; title: string; description: string }> = []) {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideFirebaseTestingMocks(),
          { provide: AuthService, useValue: { currentUser: signal({ uid, name: 'Test', boards }) } },
        ],
      });
      return TestBed.inject(BoardService);
    }

    beforeEach(() => {
      updateDocMock.mockReset().mockResolvedValue(undefined);
      getDocMock.mockReset().mockResolvedValue({
        data: () => ({ id: 'board-1', title: 'Board title', description: 'Board description' }),
      });
      setDocMock.mockReset().mockResolvedValue(undefined);
    });

    it('adds the current uid to contributors on a fresh join and appends the board to the user list', async () => {
      const boardService = setupWithUser('new-uid');

      await boardService.joinBoard('board-1');

      expect(updateDocMock).toHaveBeenCalledTimes(1);
      expect(updateDocMock.mock.calls[0][1]).toEqual({
        'contributors.new-uid': UserBoardAccessType.WRITE,
      });
      expect(getDocMock).toHaveBeenCalledTimes(1);
      expect(setDocMock).toHaveBeenCalledTimes(1);
      expect(setDocMock.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          boards: [{ id: 'board-1', title: 'Board title', description: 'Board description' }],
        }),
      );
    });

    it('resolves without throwing when the caller is already a contributor (rejoin)', async () => {
      updateDocMock.mockReset().mockRejectedValue(firestoreError('permission-denied'));
      const boardService = setupWithUser('existing-uid');

      await expect(boardService.joinBoard('board-1')).resolves.toBeUndefined();
      expect(getDocMock).toHaveBeenCalledTimes(1);
      expect(setDocMock).toHaveBeenCalledTimes(1);
    });

    it('is idempotent: does not duplicate or re-fetch the board if it is already in the user list', async () => {
      const boardService = setupWithUser('existing-uid', [
        { id: 'board-1', title: 'Board title', description: 'Board description' },
      ]);
      updateDocMock.mockReset().mockRejectedValue(firestoreError('permission-denied'));

      await expect(boardService.joinBoard('board-1')).resolves.toBeUndefined();
      expect(getDocMock).not.toHaveBeenCalled();
      expect(setDocMock).not.toHaveBeenCalled();
    });

    it('propagates a not-found error when the board does not exist', async () => {
      updateDocMock.mockReset().mockRejectedValue(firestoreError('not-found'));
      const boardService = setupWithUser('new-uid');

      await expect(boardService.joinBoard('missing-board')).rejects.toThrow('not-found');
      expect(getDocMock).not.toHaveBeenCalled();
      expect(setDocMock).not.toHaveBeenCalled();
    });

    it('throws without calling updateDoc when the user is not authenticated', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideFirebaseTestingMocks(),
          { provide: AuthService, useValue: { currentUser: signal(undefined) } },
        ],
      });
      const boardService = TestBed.inject(BoardService);

      await expect(boardService.joinBoard('board-1')).rejects.toThrow('Not authenticated');
      expect(updateDocMock).not.toHaveBeenCalled();
    });
  });
});
