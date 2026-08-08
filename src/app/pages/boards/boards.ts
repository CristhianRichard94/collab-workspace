import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../../services/user';
import { BoardService } from '../../services/board';
import { RouterLink } from "@angular/router";
import { Layout } from '../../layout/layout';

@Component({
  selector: 'app-boards',
  imports: [RouterLink, Layout],
  templateUrl: './boards.html',
  styleUrl: './boards.css',
})
export class Boards implements OnInit {
  userService: UserService = inject(UserService);
  boardService: BoardService = inject(BoardService);

  currentUser = this.userService.currentUser;

  ngOnInit(): void {
    if (!this.userService.currentUser()) {
      this.userService.login("");
    }
  }

  joinBoard(url: string) {

  }
}
