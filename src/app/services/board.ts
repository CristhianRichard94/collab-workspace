import { computed, resource, Service, signal } from '@angular/core';
import { Board, DefaultColumns } from '../types/board';
import { mockBoards } from './mock';
const initialBoard: Board = {
  columns: DefaultColumns,
  id: '1',
  title: 'test',
  description: '',
  previewUrl: '',
};
@Service()
export class BoardService {
  private _boardId = signal<string>('');

  boardId = this._boardId.asReadonly();
  // board = this.board.asReadonly()

  // ponytail: fake httpResource backed by mock.ts, swap for real httpResource once API exists
  board$ = resource<Board | undefined, string>({
    params: () => this.boardId(),
    loader: async ({ params: id }) => {
      if (!id) return undefined;
      const board = mockBoards.find((b) => b.id === id);
      board?.columns.sort((a,b) => a.index-b.index);
      return board
    },
  });
  board = this.board$.value;

  setBoardId(id: string) {
    this._boardId.set(id);
  }

  totaltasks = computed(
    () => this.board()?.columns.reduce((acc, curr) => acc + curr.tasks.length, 0) || 0,
  );

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
}
