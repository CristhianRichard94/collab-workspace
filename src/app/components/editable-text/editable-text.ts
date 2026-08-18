import { afterRenderEffect, Component, DestroyRef, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import gsap from 'gsap';
import { AnimationService } from '../../services/animation';

@Component({
  selector: 'app-editable-text',
  template: `
    @if (editing()) {
      <input
        #inputEl
        class="title-edit-input"
        [value]="draft()"
        (input)="draft.set($any($event.target).value)"
        (keydown.enter)="confirm()"
        (keydown.escape)="cancel()"
        (blur)="confirm()"
      />
    } @else {
      <span #displayGroup class="display-group">
        <span [title]="value()">{{ value() }}</span>
        <button type="button" class="edit-btn" (click)="startEdit()" [attr.aria-label]="ariaLabel()">✎</button>
      </span>
    }
  `,
  styleUrl: './editable-text.css'
})
export class EditableText {
  value = input.required<string>();
  ariaLabel = input('Edit text');
  save = output<string>();

  editing = signal(false);
  draft = signal('');

  private animationService = inject(AnimationService);
  private destroyRef = inject(DestroyRef);
  private displayGroup = viewChild<ElementRef<HTMLElement>>('displayGroup');
  private inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  /** gsap.context() scopes, reverted before re-creation and on destroy to avoid matchMedia listener leaks. */
  private startEditCtx?: gsap.Context;
  private inputInCtx?: gsap.Context;

  constructor() {
    // Runs after Angular flushes the @if swap into the DOM, so focusing the
    // input never has to wait on the fade-in tween's completion.
    afterRenderEffect(() => {
      if (!this.editing()) return;
      const input = this.inputEl()?.nativeElement;
      if (!input) return;

      input.focus();
      this.animateInputIn(input);
    });

    this.destroyRef.onDestroy(() => {
      this.startEditCtx?.revert();
      this.inputInCtx?.revert();
    });
  }

  startEdit() {
    const displayEl = this.displayGroup()?.nativeElement;

    const enterEditMode = () => {
      this.draft.set(this.value());
      this.editing.set(true);
    };

    if (this.animationService.prefersReducedMotion() || !displayEl) {
      enterEditMode();
      return;
    }

    this.startEditCtx?.revert();
    this.startEditCtx = this.animationService.context(displayEl, () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.to(displayEl, { opacity: 0, duration: 0.08, ease: 'power1.in', onComplete: enterEditMode });
      });
    });
  }

  private animateInputIn(input: HTMLInputElement | undefined) {
    if (!input) return;
    if (this.animationService.prefersReducedMotion()) return;

    this.inputInCtx?.revert();
    this.inputInCtx = this.animationService.context(input, () => {
      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(input, { opacity: 0 }, { opacity: 1, duration: 0.12, ease: 'power1.out' });
      });
    });
  }

  cancel() {
    this.editing.set(false);
  }

  confirm() {
    const value = this.draft().trim();
    this.editing.set(false);
    if (!value || value === this.value()) return;
    this.save.emit(value);
  }
}
