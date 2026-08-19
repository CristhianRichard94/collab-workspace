import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop';
import { BoardService } from '../../services/board';
import { AuthService } from '../../services/auth';
import { Task } from '../../types/board';
import { EditableText } from '../editable-text/editable-text';

@Component({
  selector: 'app-board-component',
  imports: [CommonModule, CdkDrag, CdkDropList, CdkDropListGroup, EditableText],
  templateUrl: './board-component.html',
  styleUrl: './board-component.css',
})
export class BoardComponent {
  boardService = inject(BoardService);
  authService = inject(AuthService);

  openInvite = output<void>();
  editTask = output<{ columnIndex: number; task?: Task }>();

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

  createOrEditTask(columnIndex: number, task?: Task) {
    this.editTask.emit({ columnIndex, task });
  }

  deleteTask(event: Event, columnIndex: number, taskId: string) {
    event.stopPropagation();
    this.boardService.deleteTask(taskId, columnIndex);
  }
}
