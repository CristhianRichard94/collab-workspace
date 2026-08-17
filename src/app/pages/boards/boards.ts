import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth';
import { BoardService } from '../../services/board';
import { Router, RouterLink } from '@angular/router';
import { Layout } from '../../layout/layout';
import { addDoc, collection, doc, Firestore, setDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-boards',
  imports: [RouterLink, Layout],
  templateUrl: './boards.html',
  styleUrl: './boards.css',
})
export class Boards {
  authService: AuthService = inject(AuthService);
  boardService: BoardService = inject(BoardService);
  firestore = inject(Firestore);
  router = inject(Router);

  currentUser = this.authService.currentUser;

  joinBoard() {}


  async createBoard() {
    try {
      const board = await this.boardService.createBoard();
      this.router.navigate(['boards', board?.id]);

    } catch (e) {
      console.error(`Error on board creation: ${e}`);
    }
  }
}
