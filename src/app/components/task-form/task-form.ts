import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { form, FormField, required } from '@angular/forms/signals';
import { AuthService } from '../../services/auth';
import { BoardService } from '../../services/board';
import { UserService } from '../../services/user';
import { Task } from '../../types/board';
import { User } from '../../types/user';

interface TaskFormData {
  title: string;
  description: string;
  assignedTo: string;
}

const EMPTY_TASK: TaskFormData = { title: '', description: '', assignedTo: '' };

@Component({
  selector: 'app-task-form',
  imports: [FormField, DatePipe],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
  host: {
    class: 'w-[90vw] max-w-[36rem] md:max-w-2xl lg:max-w-3xl',
  },
})
export class TaskForm {
  columnIndex = input.required<number>();
  task = input<Partial<Task> | null>(null);
  boardService = inject(BoardService);
  userService = inject(UserService);
  authService = inject(AuthService);
  contributors = signal<Array<User>>([]);

  taskData = signal<TaskFormData>(EMPTY_TASK);
  /**
   * Signal Forms wiring: `form()` binds `taskData` as the form's live model
   * (it does not clone it — form controls read/write straight through to
   * this signal), and the schema callback receives a typed `fieldPath` used
   * to declare per-field validators like `required` without a separate
   * FormGroup/FormControl tree. The template binds individual controls via
   * the `FormField` directive against `taskForm.<field>`.
   */
  taskForm = form(this.taskData, (fieldPath) => {
    required(fieldPath.title, { message: 'Task name is required.' });
  });

  newCommentText = signal('');
  comments = signal<Task['comments']>([]);

  /** Firestore returns `createdAt` as a Timestamp, not a Date — DatePipe needs a real Date. */
  createdAtDate = computed(() => {
    const createdAt = this.task()?.createdAt as unknown;
    if (createdAt instanceof Date) return createdAt;
    if (createdAt && typeof (createdAt as { toDate?: () => Date }).toDate === 'function') {
      return (createdAt as { toDate: () => Date }).toDate();
    }
    return createdAt ? new Date(createdAt as string) : null;
  });

  closeModal = output();

  constructor() {
    effect(() => {
      const task = this.task();
      this.taskData.set({
        title: task?.title ?? '',
        description: task?.description ?? '',
        assignedTo: task?.assignedTo?.uid ?? '',
      });
      this.comments.set(Array.isArray(task?.comments) ? task.comments : []);
    });

    // This effect awaits `getContributors` (an async Firestore query) inside
    // its own body rather than delegating to a resource, because its output
    // (`contributors`) is only ever consumed locally for assigning a task
    // and doesn't need resource-level loading/error state. The effect still
    // tracks its reactive dependency (`board().contributors`) synchronously
    // before the first `await`, so re-runs on board changes work as normal;
    // the `await` only defers writing the result into `contributors`.
    effect(async () => {
      const contributorPermissions = this.boardService.board()?.contributors;
      if (!contributorPermissions || Object.keys(contributorPermissions).length === 0) {
        this.contributors.set([]);
        return;
      }

      const queryResults = await this.userService.getContributors(contributorPermissions);
      const uniqueByUid = new Map<string, User>();
      queryResults.forEach((d) => {
        const user = d.data() as User;
        uniqueByUid.set(user.uid, user);
      });
      this.contributors.set(Array.from(uniqueByUid.values()));
    });
  }

  postComment() {
    const text = this.newCommentText().trim();
    const taskId = this.task()?.id;
    if (!text || !taskId) return;

    const comment = {
      text,
      createdAt: new Date().toISOString(),
      user: this.authService.currentUser()?.name ?? 'Unknown',
    };
    this.boardService.addComment(taskId, this.columnIndex(), comment);
    this.comments.update((comments) => [...(Array.isArray(comments) ? comments : []), comment]);
    this.newCommentText.set('');
  }

  async submitForm($event: Event) {
    $event.preventDefault();
    const existingTask = this.task();
    const { assignedTo, ...formData } = this.taskData();
    const assignedUser = this.contributors().find((u) => u.uid === assignedTo);
    const currentUser = this.authService.currentUser();

    const task = {
      ...existingTask,
      ...formData,
      id: existingTask?.id ?? crypto.randomUUID(),
      ...(assignedUser ? { assignedTo: assignedUser } : { assignedTo: null }),
      createdBy: existingTask?.createdBy ?? currentUser,
      createdAt: existingTask?.createdAt || new Date(),
    } as Task;

    try {
      await this.boardService.updateTask(task, this.columnIndex());
      this.closeModal.emit();
    } catch (e) {
      console.error(e);
    }
  }
}
