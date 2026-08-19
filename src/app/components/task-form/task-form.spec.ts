import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { TaskForm } from './task-form';
import { BoardService } from '../../services/board';
import { UserService } from '../../services/user';
import { AuthService } from '../../services/auth';
import { Board, Task } from '../../types/board';
import { User } from '../../types/user';

describe('TaskForm', () => {
  let component: TaskForm;
  let fixture: ComponentFixture<TaskForm>;
  let boardServiceMock: {
    board: ReturnType<typeof signal<Board | undefined>>;
    addComment: ReturnType<typeof vi.fn>;
    updateTask: ReturnType<typeof vi.fn>;
  };
  let userServiceMock: { getContributors: ReturnType<typeof vi.fn> };
  let authServiceMock: { currentUser: ReturnType<typeof signal<User | undefined>> };

  function boardWithContributors(contributors: Record<string, number> = {}): Board {
    return {
      id: 'board-1',
      title: 'Board',
      description: '',
      contributors,
      columns: [],
    } as unknown as Board;
  }

  function fakeQuerySnapshot(users: User[]) {
    return {
      forEach: (callback: (doc: { data: () => User }) => void) => {
        users.forEach((user) => callback({ data: () => user }));
      },
    };
  }

  async function setup(task: Partial<Task> | null = null) {
    await TestBed.configureTestingModule({
      imports: [TaskForm],
      providers: [
        { provide: BoardService, useValue: boardServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskForm);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columnIndex', 0);
    if (task !== null) fixture.componentRef.setInput('task', task);
    await fixture.whenStable();
  }

  beforeEach(() => {
    boardServiceMock = {
      board: signal<Board | undefined>(boardWithContributors()),
      addComment: vi.fn(),
      updateTask: vi.fn().mockResolvedValue(undefined),
    };
    userServiceMock = { getContributors: vi.fn().mockResolvedValue(fakeQuerySnapshot([])) };
    authServiceMock = { currentUser: signal<User | undefined>({ uid: 'u1', name: 'Test', boards: [] }) };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  describe('task input sync effect', () => {
    it('resets to an empty form when no task is provided', async () => {
      await setup();
      expect(component.taskData()).toEqual({ title: '', description: '', assignedTo: '' });
      expect(component.comments()).toEqual([]);
    });

    it('populates the form fields from an existing task', async () => {
      const task: Partial<Task> = {
        title: 'Fix bug',
        description: 'Details',
        assignedTo: { uid: 'u2', name: 'Alice', boards: [] },
        comments: [{ text: 'hi', createdAt: '2024-01-01', user: 'Alice' }],
      };

      await setup(task);

      expect(component.taskData()).toEqual({
        title: 'Fix bug',
        description: 'Details',
        assignedTo: 'u2',
      });
      expect(component.comments()).toEqual(task.comments);
    });
  });

  describe('contributors effect', () => {
    it('leaves contributors empty when the board has none', async () => {
      await setup();
      expect(userServiceMock.getContributors).not.toHaveBeenCalled();
      expect(component.contributors()).toEqual([]);
    });

    it('fetches and de-dupes contributors by uid when the board has some', async () => {
      const alice: User = { uid: 'u2', name: 'Alice', boards: [] };
      userServiceMock.getContributors.mockResolvedValue(fakeQuerySnapshot([alice, alice]));
      boardServiceMock.board.set(boardWithContributors({ u2: 1 }));

      await setup();

      expect(userServiceMock.getContributors).toHaveBeenCalledWith({ u2: 1 });
      expect(component.contributors()).toEqual([alice]);
    });
  });

  describe('postComment', () => {
    it('does nothing when the comment text is empty', async () => {
      await setup({ id: 't1' });
      component.newCommentText.set('   ');

      component.postComment();

      expect(boardServiceMock.addComment).not.toHaveBeenCalled();
    });

    it('does nothing when there is no task id', async () => {
      await setup();
      component.newCommentText.set('hello');

      component.postComment();

      expect(boardServiceMock.addComment).not.toHaveBeenCalled();
    });

    it('adds the comment, appends it locally, and clears the input', async () => {
      await setup({ id: 't1' });
      component.newCommentText.set('hello');

      component.postComment();

      expect(boardServiceMock.addComment).toHaveBeenCalledWith(
        't1',
        0,
        expect.objectContaining({ text: 'hello', user: 'Test' }),
      );
      expect(component.comments()).toEqual([expect.objectContaining({ text: 'hello' })]);
      expect(component.newCommentText()).toBe('');
    });
  });

  describe('submitForm', () => {
    function submitEvent() {
      const event = new Event('submit');
      vi.spyOn(event, 'preventDefault');
      return event;
    }

    it('prevents default and creates a new task with a generated id when there is no existing task', async () => {
      await setup();
      component.taskData.set({ title: 'New task', description: '', assignedTo: '' });
      const event = submitEvent();

      await component.submitForm(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(boardServiceMock.updateTask).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New task', assignedTo: null }),
        0,
      );
      const [submittedTask] = boardServiceMock.updateTask.mock.calls[0];
      expect(submittedTask.id).toEqual(expect.any(String));
    });

    it('resolves assignedTo from the contributors list', async () => {
      const alice: User = { uid: 'u2', name: 'Alice', boards: [] };
      userServiceMock.getContributors.mockResolvedValue(fakeQuerySnapshot([alice]));
      boardServiceMock.board.set(boardWithContributors({ u2: 1 }));
      await setup();
      component.taskData.set({ title: 'Task', description: '', assignedTo: 'u2' });

      await component.submitForm(submitEvent());

      expect(boardServiceMock.updateTask).toHaveBeenCalledWith(
        expect.objectContaining({ assignedTo: alice }),
        0,
      );
    });

    it('preserves createdBy/createdAt/id when editing an existing task', async () => {
      const createdBy: User = { uid: 'creator', name: 'Creator', boards: [] };
      const createdAt = new Date('2024-01-01');
      await setup({ id: 'existing-1', title: 'Old', description: '', createdBy, createdAt });

      component.taskData.set({ title: 'Updated', description: 'desc', assignedTo: '' });
      await component.submitForm(submitEvent());

      expect(boardServiceMock.updateTask).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'existing-1', title: 'Updated', createdBy, createdAt }),
        0,
      );
    });

    it('emits closeModal after a successful update', async () => {
      await setup();
      const emitted: unknown[] = [];
      component.closeModal.subscribe(() => emitted.push(true));
      component.taskData.set({ title: 'Task', description: '', assignedTo: '' });

      await component.submitForm(submitEvent());

      expect(emitted).toHaveLength(1);
    });

    it('logs and does not emit closeModal when updateTask rejects', async () => {
      boardServiceMock.updateTask.mockRejectedValue(new Error('save failed'));
      await setup();
      const emitted: unknown[] = [];
      component.closeModal.subscribe(() => emitted.push(true));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      component.taskData.set({ title: 'Task', description: '', assignedTo: '' });

      await component.submitForm(submitEvent());

      expect(emitted).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});
