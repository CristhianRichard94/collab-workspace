import { computed, inject, Service, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Board, BoardPreview, Comment, Task } from '../types/board';
import {
  addDoc,
  collection,
  doc,
  docData,
  Firestore,
  getDoc,
  setDoc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth';
import { UserBoardAccessType } from '../types/user';

@Service()
export class BoardService {
  firestore = inject(Firestore);
  private _boardId = signal<string>('');
  private authService = inject(AuthService);

  boardId = this._boardId.asReadonly();
  board$ = rxResource<Board | undefined, string>({
    params: () => this.boardId(),
    stream: ({ params: uid }) => {
      if (!uid) return of(undefined);
      const boardRef = doc(this.firestore, `boards/${uid}`);
      return docData(boardRef) as Observable<Board | undefined>;
    },
  });

  board = this.board$.value;

  setBoardId(id: string) {
    this._boardId.set(id);
  }

  totaltasks = computed(
    () => this.board()?.columns.reduce((acc, curr) => acc + curr.tasks.length, 0) || 0,
  );

  async createBoard() {
    const boardsCollection = collection(this.firestore, 'boards');
    const usersCollection = collection(this.firestore, 'users');
    const currentUser = this.authService.currentUser();

    const result = await addDoc(boardsCollection, {
      created_at: `${new Date(Date.now())}`,
      created_by: currentUser?.uid,
      title: `New ${currentUser?.name} board`,
      description: '',
      contributors: { [currentUser?.uid ?? '']: UserBoardAccessType.ADMIN },
    });
    const board = {
      id: result.id,
      title: `New ${currentUser?.name} board`,
      description: '',
    };
    const userRef = doc(this.firestore, `users/${currentUser?.uid}`);
    const boardInUser = await setDoc(userRef, {
      ...currentUser,
      boards: (currentUser?.boards ?? []).concat([board]),
    });
    return board;
  }
  /**
   * Joins the current user to the given board as a contributor.
   *
   * We intentionally do NOT read the board first: security rules deny
   * `read` to non-contributors, so a pre-check `getDoc` would always throw
   * `permission-denied` for a legitimate first-time join. Instead we go
   * straight to `updateDoc`, which Firestore rejects naturally with
   * `not-found` if the board doesn't exist.
   *
   * If the caller is *already* a contributor, the rules forbid touching
   * `contributors` on that write path, so `updateDoc` fails with
   * `permission-denied` even though the user is legitimately allowed to be
   * here (e.g. re-clicking an invite link they already used). That case is
   * not an error from the user's perspective, so we swallow it and continue
   * — any other error (like `not-found`) is rethrown as-is.
   *
   * Either way, once the user is (or already was) a contributor we also
   * make sure the board shows up in their `users/{uid}.boards` list, since
   * that's what the Boards page renders from.
   */
  async joinBoard(boardId: string) {
    const currentUser = this.authService.currentUser();
    if (!currentUser?.uid) throw new Error('Not authenticated');

    const boardRef = doc(this.firestore, `boards/${boardId}`);
    try {
      await updateDoc(boardRef, {
        [`contributors.${currentUser.uid}`]: UserBoardAccessType.WRITE,
      });
    } catch (e) {
      const code = (e as { code?: string } | undefined)?.code;
      if (code !== 'permission-denied') {
        throw e;
      }
    }

    await this.addBoardToUserList(boardId, currentUser.uid);
  }

  /**
   * Ensures `boardId` is listed under `users/{uid}.boards`, fetching the
   * board's title/description if it isn't already present. No-op if the
   * user already has it (idempotent for rejoin flows).
   */
  private async addBoardToUserList(boardId: string, uid: string) {
    const currentUser = this.authService.currentUser();
    if (currentUser?.boards?.some((b) => b.id === boardId)) return;

    const boardRef = doc(this.firestore, `boards/${boardId}`);
    const boardSnap = await getDoc(boardRef);
    const boardData = boardSnap.data() as Board | undefined;
    if (!boardData) return;

    const boardPreview: BoardPreview = {
      id: boardId,
      title: boardData.title,
      description: boardData.description,
    };

    const userRef = doc(this.firestore, `users/${uid}`);
    await setDoc(userRef, {
      ...currentUser,
      boards: (currentUser?.boards ?? []).concat([boardPreview]),
    });
  }

  renameBoard(name: string) {
    const board = this.board()!;
    board.title = name;
    this.updateBoard(board)
  }

  moveTask(
    taskId: string,
    previousColumnIndex: number,
    targetColumnIndex: number,
    targetTaskIndex: number,
  ) {
    const board = this.board();
    if (!board) return;
    const task = board.columns[previousColumnIndex].tasks.find((t) => t.id === taskId);
    if (!task) return;

    const columns = board.columns.map((col, i) => {
      if (i !== previousColumnIndex && i !== targetColumnIndex) return col;

      if (previousColumnIndex === targetColumnIndex) {
        const tasks = col.tasks.filter((t) => t.id !== taskId);
        tasks.splice(targetTaskIndex, 0, task);
        return { ...col, tasks };
      }

      if (i === previousColumnIndex) {
        return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
      }

      const tasks = [...col.tasks];
      tasks.splice(targetTaskIndex, 0, task);
      return { ...col, tasks };
    });

    this.board.set({ ...board, columns });
    this.updateBoard(this.board() as Board)
  }

  addColumn() {
    const board = this.board();
    if (!board) return;
    const index = board.columns?.length || 0;
    const column = { name: `New Column-${index}`, tasks: [], description: '', id: `${index}` };
    const columns = [...(board.columns || []), column];

    this.updateBoard({ ...board, columns });
  }

  renameColumn(name: string, index: number) {
    const board = this.board();
    const column = board?.columns[index];
    if (column) {
      column.name = name;
    }
    this.updateBoard({ ...(board as Board) });
  }

  updateBoard(board: Board) {
    const boardCollection = collection(this.firestore, 'boards');
    const boardRef = doc(boardCollection, this._boardId());
    setDoc(boardRef, board);
  }

  /**
   * This method creates or updates a task
   */
  updateTask(task: Task, columnIndex: number) {
    const board = this.board();
    if (!board) return;

    const actualColumn = board.columns.find((c) => c.tasks.some((t) => t.id === task.id));
    if (actualColumn) {
      const existingTaskIndex = actualColumn.tasks.findIndex((t) => t.id === task.id);
      actualColumn.tasks[existingTaskIndex] = task;
    } else {
      board.columns[columnIndex].tasks.push(task);
    }
    this.updateBoard(board);
  }

  deleteTask(taskId: string, columnIndex: number) {
    const board = this.board();
    if (!board) return;
    board.columns[columnIndex].tasks = board.columns[columnIndex].tasks.filter(
      (t) => t.id !== taskId,
    );
    this.updateBoard(board);
  }

  addComment(taskId: string, columnIndex: number, comment: Comment) {
    const board = this.board();
    if (!board) return;
    const task = board.columns[columnIndex].tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.comments = [...(Array.isArray(task.comments) ? task.comments : []), comment];
    this.updateBoard(board);
  }
}
