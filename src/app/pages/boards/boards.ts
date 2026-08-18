import { Component, DestroyRef, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth';
import { BoardService } from '../../services/board';
import { Router, RouterLink } from '@angular/router';
import { Layout } from '../../layout/layout';
import { Firestore } from '@angular/fire/firestore';
import { AnimationService } from '../../services/animation';
import gsap from 'gsap';

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
  private animationService = inject(AnimationService);
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  currentUser = this.authService.currentUser;

  joinLinkInput = signal('');

  /** Guards the board list entrance stagger so it only plays once per load. */
  private hasAnimatedIn = false;

  /** gsap.context() scope, reverted before re-creation and on destroy to avoid matchMedia listener leaks. */
  private entranceCtx?: gsap.Context;

  constructor() {
    effect(() => {
      const boards = this.authService.currentUser()?.boards;
      if (!boards?.length || this.hasAnimatedIn || !isPlatformBrowser(this.platformId)) return;

      this.hasAnimatedIn = true;
      queueMicrotask(() => this.animateBoardsIn());
    });

    this.destroyRef.onDestroy(() => this.entranceCtx?.revert());
  }

  private animateBoardsIn() {
    if (this.animationService.prefersReducedMotion()) {
      gsap.set('.board-item', { clearProps: 'opacity' });
      return;
    }

    this.entranceCtx?.revert();
    this.entranceCtx = this.animationService.context(document.body, () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const items = gsap.utils.toArray<HTMLElement>('.board-item');
        if (!items.length) return;

        gsap.from(items, {
          opacity: 0,
          y: 16,
          duration: 0.3,
          ease: 'power2.out',
          stagger: { each: 0.06, amount: Math.min(0.06 * items.length, 0.36) },
        });
      });
    });
  }

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
