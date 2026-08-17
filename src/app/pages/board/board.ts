import { Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { BoardService } from '../../services/board';
import { Layout } from '../../layout/layout';
import {CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup} from '@angular/cdk/drag-drop';
import { Task } from '../../types/board';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-board',
  imports: [Layout, CommonModule, CdkDrag, CdkDropList, CdkDropListGroup],
  templateUrl: './board.html',
  styleUrl: './board.css',
})
export class Board {
  boardService = inject(BoardService);
  authService = inject(AuthService);
  id = input.required<string>();

  editingTarget = signal<'board' | number | null>(null);
  editValue = signal('');

  constructor() {
    effect(() => {
      this.boardService.setBoardId(this.id());
    })
  }

  startEdit(target: 'board' | number, currentValue: string) {
    this.editingTarget.set(target);
    this.editValue.set(currentValue);
  }

  cancelEdit() {
    this.editingTarget.set(null);
  }

  confirmEdit() {
    const target = this.editingTarget();
    const value = this.editValue().trim();
    if (target === null || !value) {
      this.editingTarget.set(null);
      return;
    }
    if (target === 'board') {
      this.boardService.renameBoard(value);
    } else {
      this.boardService.renameColumn(value, target);
    }
    this.editingTarget.set(null);
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
}
