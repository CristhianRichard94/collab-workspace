import { computed, Resource, Service, signal } from '@angular/core';
import { Board } from '../types/board';
import { httpResource, HttpResourceRef } from '@angular/common/http';
import { mockBoards } from './mock';

@Service()
export class BoardService {
  private boardId = signal<string>('');

  // board = httpResource<Board>(()=> {
  //     const id = this.boardId();
  //     return id ? `/board/${id}` : ""
  // }
  // );
    setBoardId(id: string)  {
        this.boardId.set(id);
    }
    board = {
        error: () => null,
        isLoading: () => null,
        value: () => mockBoards.find(b => b.id === this.boardId())!
    }
  totalCards = computed(() => this.board.value()?.cards.length || 0);
}
