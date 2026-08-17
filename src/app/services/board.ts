import { computed, inject, resource, Service, signal } from '@angular/core';
import { Board, DefaultColumns } from '../types/board';
import { addDoc, collection, doc, docData, Firestore, setDoc } from '@angular/fire/firestore';
import { AuthService } from './auth';

const initialBoard: Board = {
  columns: DefaultColumns,
  id: '1',
  title: 'test',
  description: '',
  previewUrl: '',
  contributors: [
    {
      role: 0,
      userId: '1',
    },
  ],
};
@Service()
export class BoardService {
  firestore = inject(Firestore);
  private _boardId = signal<string>('');
  private authService = inject(AuthService)

  boardId = this._boardId.asReadonly();
  // board = this.board.asReadonly()

  // ponytail: fake httpResource backed by mock.ts, swap for real httpResource once API exists
  board$ = resource<Board | undefined, string>({
    params: () => this.boardId(),
    loader: async ({ params: uid }) => {
      if (!uid) return undefined;
      const boardRef = doc(this.firestore, `boards/${uid}`);
      return await new Promise<Board | undefined>((resolve) => {
        docData(boardRef, { idField: 'uid' }).subscribe((data) =>{
          console.log(data);
          resolve(data as Board | undefined)}
        );
      });
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
        return board

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
  }

  addColumn() {
    const board = this.board();
    if (!board) return;
    const index = board.columns?.length || 0;
    const boardCollection = collection(this.firestore, 'boards');
    const boardRef = doc(boardCollection, this._boardId());
    const column = { name: `New Column-${index}`, tasks: [], description: '', id: `${index}` };
    const columns = [...(board.columns || []), column];

    setDoc(boardRef, { ...board, columns });
  }

  renameColumn(name: string, index: number) {
    const boardCollection = collection(this.firestore, 'boards');
    const boardRef = doc(boardCollection, this._boardId());
    const board = this.board();
    const column = board?.columns[index];
    if (column) {
      column.name = name;
    }
    setDoc(boardRef, { ...board });
  }
}
