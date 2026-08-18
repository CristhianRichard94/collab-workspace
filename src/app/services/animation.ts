import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service } from '@angular/core';
import gsap from 'gsap';

/**
 * Centralizes GSAP usage so components never touch `gsap`/`matchMedia`
 * directly. Keeps `prefers-reduced-motion` handling consistent and safe
 * for SSR (no DOM access unless running in the browser).
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
