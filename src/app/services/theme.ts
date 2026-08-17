import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, PLATFORM_ID, Service, signal } from '@angular/core';

type Theme = 'light' | 'dark' | 'system';

@Service()
export class ThemeService {
  private stored = 'system' as Theme;
  theme = signal<Theme>(this.stored);
  platformId = inject(PLATFORM_ID);

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
