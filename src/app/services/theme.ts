import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, PLATFORM_ID, Service, signal } from '@angular/core';

type Theme = 'light' | 'dark' | 'system';

@Service()
export class ThemeService {
  private stored = 'system' as Theme;
  theme = signal<Theme>(this.stored);
  platformId = inject(PLATFORM_ID);

  /**
   * Resolves `theme` to an actual `light`/`dark` value. On the server there
   * is no `matchMedia` to consult and no persisted preference to read yet,
   * so SSR always falls back to `'dark'` — chosen to match this app's
   * default visual design, avoiding a light-to-dark flash for users who
   * haven't overridden the theme once client JS hydrates and re-resolves it.
   */
  resolvedTheme = computed(() => {
      if (isPlatformBrowser(this.platformId)) {
    const t = this.theme();
    if (t !== 'system') return t;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } else {
    return 'dark'
  }
  });

  constructor() {
    // `stored` is read from localStorage on every run of this effect (not
    // just once) and immediately written back after applying `data-theme`.
    // This read-then-write on each reactive pass keeps `stored` in sync with
    // whatever is currently persisted (e.g. changed in another tab) before
    // this effect's own write potentially overwrites it with `theme()`'s
    // current value.
    effect(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.stored = localStorage.getItem('theme') as Theme;
        document.documentElement.setAttribute('data-theme', this.resolvedTheme());
        localStorage.setItem('theme', this.theme());
      }
    });
  }

  setTheme(t: Theme) {
    this.theme.set(t);
  }
}
