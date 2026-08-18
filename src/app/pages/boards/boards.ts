import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth';
import { BoardService } from '../../services/board';
import { Router, RouterLink } from '@angular/router';
import { Layout } from '../../layout/layout';
import { Firestore } from '@angular/fire/firestore';

/**
 * Parses a board id out of a pasted share link (either a `/join/:id` or a
 * `/boards/:id` URL, absolute or relative) or a bare id. Returns null when
 * nothing usable can be extracted.
 */
export function extractBoardIdFromLink(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/\/(?:join|boards)\/([^/?#]+)/);
  if (match) return match[1];

  // No recognizable path segment: treat as a bare id if it looks like one
  // (no whitespace, no scheme separators).
  if (/^[A-Za-z0-9_-]+$/.test(trimmed)) return trimmed;

  return null;
}

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

  joinLinkInput = signal('');

  joinBoard() {
    const boardId = extractBoardIdFromLink(this.joinLinkInput());
    if (!boardId) return;
    this.router.navigate(['join', boardId]);
  }

  async createBoard() {
    try {
      const board = await this.boardService.createBoard();
      this.router.navigate(['boards', board?.id]);

    } catch (e) {
      console.error(`Error on board creation: ${e}`);
    }
  }
}
