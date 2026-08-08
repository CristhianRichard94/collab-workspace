import { Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { BoardService } from '../../services/board';
import { Layout } from '../../layout/layout';
import {CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup} from '@angular/cdk/drag-drop';
import { Task } from '../../types/board';
import { UserService } from '../../services/user';
@Component({
  selector: 'app-board',
  imports: [Layout, CdkDrag, CdkDropList, CdkDropListGroup],
  templateUrl: './board.html',
  styleUrl: './board.css',
})
export class Board {
  boardService = inject(BoardService);
  userService = inject(UserService);
  id = input.required<string>();

  constructor() {
    effect(() => {
      this.boardService.setBoardId(this.id());
    })
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
}
