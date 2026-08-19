import { Component, DestroyRef, effect, inject, input, OnInit, PLATFORM_ID, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BoardService } from '../../services/board';
import { Layout } from '../../layout/layout';
import { Task } from '../../types/board';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TaskForm } from '../../components/task-form/task-form';
import { InviteDialog } from '../../components/invite-dialog/invite-dialog';
import { BoardSkeleton } from '../../components/board-skeleton/board-skeleton';
import { BoardComponent } from '../../components/board-component/board-component';
import { AnimationService } from '../../services/animation';
import gsap from 'gsap';
@Component({
  selector: 'app-board',
  imports: [Layout, CommonModule, TaskForm, InviteDialog, BoardSkeleton, BoardComponent, RouterLink],
  templateUrl: './board.html',
  styleUrl: './board.css',
})
export class Board {
  boardService = inject(BoardService);
  platformId = inject(PLATFORM_ID);
  private animationService = inject(AnimationService);
  private destroyRef = inject(DestroyRef);
  id = input.required<string>();
  inviteDialog = viewChild(InviteDialog);

  /** Tracks the element to restore focus to once the active dialog finishes closing. */
  private lastFocusedElement: HTMLElement | null = null;

  /** gsap.context() scopes, reverted before re-creation and on destroy to avoid matchMedia listener leaks. */
  private entranceCtx?: gsap.Context;
  private dialogCtx?: gsap.Context;

  editTaskColumnIndex = signal<number>(0);
  editTask = signal<Task | null>(null);

  /** Guards the board entrance stagger animation so it only ever plays once per load. */
  private hasAnimatedIn = signal(false);

  constructor() {
    effect(() => {
      this.boardService.setBoardId(this.id());
    });

    effect(() => {
      const board = this.boardService.board$.value();
      const isLoading = this.boardService.board$.isLoading();
      if (isLoading || !board || this.hasAnimatedIn()) return;
      if (!isPlatformBrowser(this.platformId)) return;

      this.hasAnimatedIn.set(true);
      queueMicrotask(() => this.animateBoardEntrance());
    });

    this.destroyRef.onDestroy(() => {
      this.entranceCtx?.revert();
      this.dialogCtx?.revert();
    });
  }

  private animateBoardEntrance() {
    if (this.animationService.prefersReducedMotion()) {
      gsap.set('.column, .task', { clearProps: 'opacity' });
      return;
    }

    this.entranceCtx?.revert();
    this.entranceCtx = this.animationService.context(document.body, () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const columns = gsap.utils.toArray<HTMLElement>('.column');
        const tasks = gsap.utils.toArray<HTMLElement>('.task');
        if (!columns.length) return;

        const tl = gsap.timeline();
        tl.from(columns, { opacity: 0, y: 20, duration: 0.35, ease: 'power2.out', stagger: 0.08 });
        if (tasks.length) {
          tl.from(
            tasks,
            {
              opacity: 0,
              y: 12,
              duration: 0.25,
              ease: 'power2.out',
              stagger: { each: 0.04, amount: Math.min(0.04 * tasks.length, 0.4) },
            },
            '<0.1',
          );
        }
      });
    });
  }

  /** Opens a <dialog> with an entrance tween on its content, skipped entirely under reduced motion. */
  private openDialog(dialog: HTMLDialogElement | null) {
    if (!dialog || dialog.open) return;

    this.lastFocusedElement = document.activeElement as HTMLElement | null;
    dialog.showModal();

    if (this.animationService.prefersReducedMotion()) {
      dialog.classList.add('is-open');
      return;
    }

    this.dialogCtx?.revert();
    this.dialogCtx = this.animationService.context(dialog, () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const panel = dialog.firstElementChild as HTMLElement | null;
        requestAnimationFrame(() => dialog.classList.add('is-open'));
        if (panel) {
          gsap.fromTo(
            panel,
            { opacity: 0, y: 24, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'back.out(1.6)' },
          );
        }
      });
    });
  }

  /** Plays an exit tween before closing a <dialog>, skipped entirely under reduced motion. */
  private closeDialog(dialog: HTMLDialogElement | null, onClosed?: () => void) {
    if (!dialog) return;

    const finish = () => {
      dialog.classList.remove('is-open');
      if (dialog.open) dialog.close();
      onClosed?.();
      this.lastFocusedElement?.focus();
      this.lastFocusedElement = null;
    };

    if (this.animationService.prefersReducedMotion()) {
      finish();
      return;
    }

    let willAnimate = false;
    this.dialogCtx?.revert();
    this.dialogCtx = this.animationService.context(dialog, () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        willAnimate = true;
        const panel = dialog.firstElementChild as HTMLElement | null;
        if (!panel) {
          finish();
          return;
        }
        gsap.to(panel, {
          opacity: 0,
          y: 16,
          scale: 0.97,
          duration: 0.18,
          ease: 'power2.in',
          onComplete: finish,
        });
      });
    });

    if (!willAnimate) finish();
  }

  /** Intercepts the native `cancel` event (Esc key) so dialogs always close via the animated path. */
  onDialogCancel(event: Event, dialog: 'invite' | 'task-form') {
    event.preventDefault();
    if (dialog === 'invite') {
      this.closeInviteModal();
    } else {
      this.closeModal();
    }
  }

  openInviteModal() {
    this.inviteDialog()?.resetCopyState();
    this.openDialog(document.getElementById('invite-dialog') as HTMLDialogElement | null);
  }

  closeInviteModal() {
    this.closeDialog(document.getElementById('invite-dialog') as HTMLDialogElement | null);
  }

  createOrEditTask(columnIndex: number, task?: Task) {
    this.editTaskColumnIndex.set(columnIndex);
    this.editTask.set(task || null);
    this.openDialog(document.getElementById('task-form-dialog') as HTMLDialogElement | null);
  }

  closeModal() {
    this.closeDialog(document.getElementById('task-form-dialog') as HTMLDialogElement | null, () => {
      this.editTask.set(null);
    });
  }
}
