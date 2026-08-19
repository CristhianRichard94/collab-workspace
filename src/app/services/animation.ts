import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service } from '@angular/core';
import gsap from 'gsap';

/**
 * Centralizes GSAP usage so components never touch `gsap`/`matchMedia`
 * directly. Keeps `prefers-reduced-motion` handling consistent and safe
 * for SSR (no DOM access unless running in the browser).
 *
 * Shared pattern reused by callers such as `board.ts` (page), `boards.ts`,
 * and `editable-text.ts` (see those files for concrete usages):
 *   1. Create a scope with `context(el, fn)`, which wraps `gsap.context()`
 *      — all tweens/timelines created inside `fn` are registered to that
 *      scope so they can be torn down together.
 *   2. Inside `fn`, branch on motion preference via
 *      `gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', …)`
 *      rather than a plain `if`, so the animation logic re-evaluates
 *      automatically if the OS-level preference changes while the scope is
 *      still alive (e.g. user toggles reduced motion mid-session).
 *   3. Store the returned `gsap.Context` on the component and call
 *      `.revert()` on it before recreating the scope (to avoid leaking the
 *      previous `matchMedia` listener) and in `ngOnDestroy`/`DestroyRef`
 *      cleanup.
 * `run()` below is a lighter-weight alternative for one-off tweens that
 * don't need their own persistent scope.
 */
@Service()
export class AnimationService {
  private platformId = inject(PLATFORM_ID);

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /** Returns true when the user has requested reduced motion. Always false during SSR. */
  prefersReducedMotion(): boolean {
    if (!this.isBrowser()) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Runs `fn()` to perform an animation, unless the user prefers reduced
   * motion, in which case `endState` (a gsap.set-style vars object) is
   * applied instantly to `targets` instead.
   */
  run(fn: () => void, options?: { targets?: gsap.TweenTarget; endState?: gsap.TweenVars }): void {
    if (!this.isBrowser()) return;

    if (this.prefersReducedMotion()) {
      if (options?.targets && options?.endState) {
        gsap.set(options.targets, options.endState);
      }
      return;
    }

    fn();
  }

  /** Creates a gsap.context() scoped to `scope`. Caller must call `.revert()` (typically in ngOnDestroy). */
  context(scope: Element | string, func?: gsap.ContextFunc): gsap.Context | undefined {
    if (!this.isBrowser()) return undefined;
    return gsap.context(func ?? (() => {}), scope);
  }
}
