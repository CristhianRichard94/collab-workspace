import { Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { BoardService } from '../../services/board';
import { Layout } from '../../layout/layout';
import {CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup} from '@angular/cdk/drag-drop';
import { Task } from '../../types/board';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { TaskForm } from '../../components/task-form/task-form';
import { EditableText } from '../../components/editable-text/editable-text';
@Component({
  selector: 'app-board',
  imports: [Layout, CommonModule, CdkDrag, CdkDropList, CdkDropListGroup, TaskForm, EditableText],
  templateUrl: './board.html',
  styleUrl: './board.css',
})
export class Board {
  boardService = inject(BoardService);
  authService = inject(AuthService);
  id = input.required<string>();

  textEditingTarget = signal<'board' | number | null>(null);
  textEditValue = signal('');
  editTaskColumnIndex = signal<number>(0);
  editTask = signal<Task | null>(null);

  constructor() {
    effect(() => {
      this.boardService.setBoardId(this.id());
      console.log(this.boardService.board())
    })
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
    (document.getElementById('task-form-dialog') as HTMLDialogElement | null)?.showModal();
  }
}
