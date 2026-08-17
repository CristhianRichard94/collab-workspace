import { computed, inject, Service, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Board, DefaultColumns } from '../types/board';
import { addDoc, collection, doc, docData, Firestore, setDoc } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth';

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
      contributors: [{ uid: currentUser?.uid, role: 0 }],
    });
    const board = {
      id: result.id,
      title: `New ${currentUser?.name} board`,
      description: '',
      previewUrl: '',
    };
    const userRef = doc(this.firestore, `users/${currentUser?.uid}`);
    const boardInUser = await setDoc(userRef, {
      ...currentUser,
      boards: currentUser?.boards.concat([board]),
    });
    return board;
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
}
