import { Component, effect, inject, input, output, signal } from '@angular/core';
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
})
export class TaskForm {
  columnIndex = input.required<number>();
  task = input<Partial<Task> | null>(null);
  boardService = inject(BoardService);
  userService = inject(UserService);
  authService = inject(AuthService);
  contributors = signal<Array<User>>([]);

  taskData = signal<TaskFormData>(EMPTY_TASK);
  taskForm = form(this.taskData, (fieldPath) => {
    required(fieldPath.title, { message: 'Task name is required.' });
  });

  newCommentText = signal('');
  comments = signal<Task['comments']>([]);

  closeModal = output();

  constructor() {
    effect(() => {
      const task = this.task();
      this.taskData.set({
        title: task?.title ?? '',
        description: task?.description ?? '',
        assignedTo: task?.assignedTo?.uid ?? '',
      });
      this.comments.set(task?.comments ?? []);
    });

    effect(async () => {
      const contributorPermissions = this.boardService.board()?.contributors;
      if (!contributorPermissions?.length) {
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
    this.comments.update((comments) => [...(comments ?? []), comment]);
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
      ...(assignedUser ? { assignedTo: assignedUser } : { assignedTo: null }),
      createdBy: existingTask?.createdBy ?? currentUser,
      createdAt: existingTask?.createdAt ?? new Date(),
    } as Task;

    try {
      await this.boardService.updateTask(task, this.columnIndex());
      this.closeModal.emit();
    } catch (e) {
      console.error(e);
    }
  }
}
