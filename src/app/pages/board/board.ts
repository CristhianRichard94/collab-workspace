import { Component, effect, inject, input, OnInit, signal } from '@angular/core';
import { BoardService } from '../../services/board';
import { Layout } from '../../components/layout/layout';

@Component({
  selector: 'app-board',
  imports: [Layout],
  templateUrl: './board.html',
  styleUrl: './board.css',
})
export class Board {
  boardService = inject(BoardService);
  id = input.required<string>();

  constructor() {
    effect(() => {
      this.boardService.setBoardId(this.id());
      // console.log(this.boardService.board.value().cards);
    })
  }
}
