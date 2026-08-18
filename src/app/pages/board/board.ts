import { Component, effect, inject, input, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BoardService } from '../../services/board';
import { Layout } from '../../layout/layout';
import {CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup} from '@angular/cdk/drag-drop';
import { Task } from '../../types/board';
import { AuthService } from '../../services/auth';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TaskForm } from '../../components/task-form/task-form';
import { EditableText } from '../../components/editable-text/editable-text';
@Component({
  selector: 'app-board',
  imports: [Layout, CommonModule, CdkDrag, CdkDropList, CdkDropListGroup, TaskForm, EditableText, RouterLink],
  templateUrl: './board.html',
  styleUrl: './board.css',
})
export class Board {
  boardService = inject(BoardService);
  authService = inject(AuthService);
  platformId = inject(PLATFORM_ID);
  id = input.required<string>();

  textEditingTarget = signal<'board' | number | null>(null);
  textEditValue = signal('');
  editTaskColumnIndex = signal<number>(0);
  editTask = signal<Task | null>(null);

  linkCopied = signal(false);

  constructor() {
    effect(() => {
      this.boardService.setBoardId(this.id());
    })
  }

  get shareLink(): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    return `${location.origin}/join/${this.id()}`;
  }

  get mailtoInviteLink(): string {
    const subject = encodeURIComponent('Join my board');
    const body = encodeURIComponent(`Join my board here: ${this.shareLink}`);
    return `mailto:?subject=${subject}&body=${body}`;
  }

  openInviteModal() {
    this.linkCopied.set(false);
    (document.getElementById('invite-dialog') as HTMLDialogElement | null)?.showModal();
  }

  closeInviteModal() {
    (document.getElementById('invite-dialog') as HTMLDialogElement | null)?.close();
  }

  async copyShareLink() {
    if (!isPlatformBrowser(this.platformId) || !navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(this.shareLink);
      this.linkCopied.set(true);
    } catch (e) {
      console.error(`Error copying share link: ${e}`);
    }
  }

  startEdit(target: 'board' | number, currentValue: string) {
    this.textEditingTarget.set(target);
    this.textEditValue.set(currentValue);
  }

  cancelEdit() {
    this.textEditingTarget.set(null);
  }

  confirmEdit() {
    const target = this.textEditingTarget();
    const value = this.textEditValue().trim();
    if (target === null || !value) {
      this.textEditingTarget.set(null);
      return;
    }
    if (target === 'board') {
      this.boardService.renameBoard(value);
    } else {
      this.boardService.renameColumn(value, target);
    }
    this.textEditingTarget.set(null);
  }

  taskDropped(event: CdkDragDrop<Task[]>, targetColumnIndex: number) {
    const previousColumnId = event.previousContainer.id.replace('list-', '');
    const columns = this.boardService.board()?.columns ?? [];
    const previousColumnIndex = columns.findIndex((c) => c.id === previousColumnId);
    if (previousColumnIndex === -1) return;

    this.boardService.moveTask(
      event.item.data.id,
      previousColumnIndex,
      targetColumnIndex,
      event.currentIndex,
    );
  }

  addColumn() {
    this.boardService.addColumn();
  }


  renameColumn(event: Event, index:number) {
    const name = (event.target as HTMLParagraphElement).innerHTML
    this.boardService.renameColumn(name, index)
  }

  renameBoard(event: Event) {
    const name = (event.target as HTMLParagraphElement).innerHTML
    this.boardService.renameBoard(name);
  }

  createOrEditTask(columnIndex: number, task?: Task) {
    this.editTaskColumnIndex.set(columnIndex);
    this.editTask.set(task || null);
    (document.getElementById('task-form-dialog') as HTMLDialogElement | null)?.showModal();
  }

  closeModal() {
    (document.getElementById('task-form-dialog') as HTMLDialogElement | null)?.close();
    this.editTask.set(null);
  }

  deleteTask(event: Event, columnIndex: number, taskId: string) {
    event.stopPropagation();
    this.boardService.deleteTask(taskId, columnIndex);
  }
}
