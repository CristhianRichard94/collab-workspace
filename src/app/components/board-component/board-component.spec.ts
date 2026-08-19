import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

import { BoardComponent } from './board-component';
import { BoardService } from '../../services/board';
import { AuthService } from '../../services/auth';
import { Board, Task } from '../../types/board';

describe('BoardComponent', () => {
  let component: BoardComponent;
  let fixture: ComponentFixture<BoardComponent>;
  let boardServiceMock: {
    board: ReturnType<typeof signal<Board | undefined>>;
    board$: { value: ReturnType<typeof signal<Board | undefined>> };
    renameBoard: ReturnType<typeof vi.fn>;
    moveTask: ReturnType<typeof vi.fn>;
    addColumn: ReturnType<typeof vi.fn>;
    deleteTask: ReturnType<typeof vi.fn>;
  };

  function boardWithColumns(): Board {
    return {
      id: 'board-1',
      title: 'Board',
      description: '',
      contributors: {},
      columns: [
        { id: 'todo', name: 'Todo', tasks: [] },
        { id: 'doing', name: 'Doing', tasks: [] },
      ],
    };
  }

  beforeEach(async () => {
    const board = signal<Board | undefined>(boardWithColumns());
    boardServiceMock = {
      board,
      board$: { value: board },
      renameBoard: vi.fn(),
      moveTask: vi.fn(),
      addColumn: vi.fn(),
      deleteTask: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BoardComponent],
      providers: [
        { provide: BoardService, useValue: boardServiceMock },
        { provide: AuthService, useValue: { currentUser: signal(undefined) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('taskDropped', () => {
    function dropEvent(previousContainerId: string, taskId = 'task-1'): CdkDragDrop<Task[]> {
      return {
        previousContainer: { id: previousContainerId },
        currentIndex: 2,
        item: { data: { id: taskId } },
      } as unknown as CdkDragDrop<Task[]>;
    }

    it('moves the task using the resolved previous column index', () => {
      component.taskDropped(dropEvent('list-todo'), 1);

      expect(boardServiceMock.moveTask).toHaveBeenCalledWith('task-1', 0, 1, 2);
    });

    it('does not move the task when the previous column cannot be resolved', () => {
      component.taskDropped(dropEvent('list-unknown'), 1);

      expect(boardServiceMock.moveTask).not.toHaveBeenCalled();
    });
  });

  it('addColumn delegates to BoardService.addColumn', () => {
    component.addColumn();

    expect(boardServiceMock.addColumn).toHaveBeenCalledTimes(1);
  });

  it('createOrEditTask emits editTask with the column index and task', () => {
    const emitted: Array<{ columnIndex: number; task?: Task }> = [];
    component.editTask.subscribe((value) => emitted.push(value));
    const task = { id: 't1' } as Task;

    component.createOrEditTask(1, task);

    expect(emitted).toEqual([{ columnIndex: 1, task }]);
  });

  it('createOrEditTask emits with no task for a new task', () => {
    const emitted: Array<{ columnIndex: number; task?: Task }> = [];
    component.editTask.subscribe((value) => emitted.push(value));

    component.createOrEditTask(0);

    expect(emitted).toEqual([{ columnIndex: 0, task: undefined }]);
  });

  it('deleteTask stops propagation and delegates to BoardService.deleteTask', () => {
    const event = new Event('click');
    const stopPropagation = vi.spyOn(event, 'stopPropagation');

    component.deleteTask(event, 1, 'task-1');

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(boardServiceMock.deleteTask).toHaveBeenCalledWith('task-1', 1);
  });
});
