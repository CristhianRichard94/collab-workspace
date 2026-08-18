import { Component, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BoardService } from '../../services/board';
import { Layout } from '../../layout/layout';

@Component({
  selector: 'app-join',
  imports: [Layout, RouterLink],
  templateUrl: './join.html',
  styleUrl: './join.css',
})
export class Join {
  boardService = inject(BoardService);
  router = inject(Router);

  id = input.required<string>();

  error = signal(false);

  constructor() {
    effect(() => {
      const boardId = this.id();
      if (!boardId) return;
      this.join(boardId);
    });
  }

  private async join(boardId: string) {
    try {
      await this.boardService.joinBoard(boardId);
      this.router.navigate(['boards', boardId]);
    } catch (e) {
      console.error(`Error joining board: ${e}`);
      this.error.set(true);
    }
  }
}
