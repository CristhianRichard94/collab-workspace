import { afterRenderEffect, Component, computed, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import gsap from 'gsap';
import { ThemeService } from '../../services/theme';
import { AnimationService } from '../../services/animation';

const THEME_ORDER = ['light', 'dark', 'system'] as const;

@Component({
  selector: 'app-theme-switch',
  templateUrl: './theme-switch.html',
  styleUrl: './theme-switch.css',
})
export class ThemeSwitch {
  themeService = inject(ThemeService);
  private animationService = inject(AnimationService);
  private destroyRef = inject(DestroyRef);
  private indicator = viewChild<ElementRef<HTMLElement>>('themeIndicator');

  private activeIndex = computed(() => THEME_ORDER.indexOf(this.themeService.theme()));

  constructor() {
    let context: gsap.Context | undefined;

    afterRenderEffect(() => {
      const index = this.activeIndex();
      const el = this.indicator()?.nativeElement;
      if (!el) return;

      const targetX = `${index * 100}%`;

      if (this.animationService.prefersReducedMotion()) {
        gsap.set(el, { x: targetX });
        return;
      }

      context?.revert();
      context = this.animationService.context(el, () => {
        gsap.to(el, { x: targetX, duration: 0.3, ease: 'back.out(2.2)' });
      });
    });

    this.destroyRef.onDestroy(() => context?.revert());
  }
}
