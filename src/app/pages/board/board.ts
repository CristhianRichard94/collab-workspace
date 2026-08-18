import { Component, DestroyRef, effect, inject, input, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BoardService } from '../../services/board';
import { Layout } from '../../layout/layout';
import {CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup} from '@angular/cdk/drag-drop';
import { Task } from '../../types/board';
import { AuthService } from '../../services/auth';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { TaskForm } from '../../components/task-form/task-form';
import { EditableText } from '../../components/editable-text/editable-text';
import { AnimationService } from '../../services/animation';
import gsap from 'gsap';
@Component({
  selector: 'app-board',
  imports: [Layout, CommonModule, CdkDrag, CdkDropList, CdkDropListGroup, TaskForm, EditableText, RouterLink],
  templateUrl: './board.html',
  styleUrl: './board.css',
})
export class Board {
  boardService = inject(BoardService);
  authService = inject(AuthService);
  platformId = inject(PLATFORM_ID);
  private animationService = inject(AnimationService);
  private destroyRef = inject(DestroyRef);
  id = input.required<string>();

  /** Tracks the element to restore focus to once the active dialog finishes closing. */
  private lastFocusedElement: HTMLElement | null = null;

  /** gsap.context() scopes, reverted before re-creation and on destroy to avoid matchMedia listener leaks. */
  private entranceCtx?: gsap.Context;
  private dialogCtx?: gsap.Context;

  textEditingTarget = signal<'board' | number | null>(null);
  textEditValue = signal('');
  editTaskColumnIndex = signal<number>(0);
  editTask = signal<Task | null>(null);

  linkCopied = signal(false);

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

  get shareLink(): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    return `${location.origin}/join/${this.id()}`;
  }

  get mailtoInviteLink(): string {
    const subject = encodeURIComponent('Join my board');
    const body = encodeURIComponent(`Join my board here: ${this.shareLink}`);
    return `mailto:?subject=${subject}&body=${body}`;
  }

  openInviteModal() {
    this.linkCopied.set(false);
    this.openDialog(document.getElementById('invite-dialog') as HTMLDialogElement | null);
  }

  closeInviteModal() {
    this.closeDialog(document.getElementById('invite-dialog') as HTMLDialogElement | null);
  }

  async copyShareLink() {
    if (!isPlatformBrowser(this.platformId) || !navigator?.clipboard) return;
    try {
      await navigator.clipboard.writeText(this.shareLink);
      this.linkCopied.set(true);
    } catch (e) {
      console.error(`Error copying share link: ${e}`);
    }
  }

  startEdit(target: 'board' | number, currentValue: string) {
    this.textEditingTarget.set(target);
    this.textEditValue.set(currentValue);
  }

  cancelEdit() {
    this.textEditingTarget.set(null);
  }

  confirmEdit() {
    const target = this.textEditingTarget();
    const value = this.textEditValue().trim();
    if (target === null || !value) {
      this.textEditingTarget.set(null);
      return;
    }
    if (target === 'board') {
      this.boardService.renameBoard(value);
    } else {
      this.boardService.renameColumn(value, target);
    }
    this.textEditingTarget.set(null);
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

  addColumn() {
    this.boardService.addColumn();
  }


  renameColumn(event: Event, index:number) {
    const name = (event.target as HTMLParagraphElement).innerHTML
    this.boardService.renameColumn(name, index)
  }

  renameBoard(event: Event) {
    const name = (event.target as HTMLParagraphElement).innerHTML
    this.boardService.renameBoard(name);
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

  deleteTask(event: Event, columnIndex: number, taskId: string) {
    event.stopPropagation();
    this.boardService.deleteTask(taskId, columnIndex);
  }
}
