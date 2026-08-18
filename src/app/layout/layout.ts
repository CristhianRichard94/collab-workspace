import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth';
import { ThemeService } from '../services/theme';
import { ThemeSwitch } from '../components/theme-switch/theme-switch';

@Component({
  selector: 'app-layout',
  imports: [RouterLink, ThemeSwitch],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  host: {
    '[class.fixed-layout]': 'fixed()'
  }
})
export class Layout {
  authService = inject(AuthService);
  router: Router = inject(Router);
  themeService = inject(ThemeService);
  logoUrl = computed(() => `/logo/logo-full-${this.themeService.resolvedTheme()}.svg`)
  fixed = input<boolean>(true);

  logout() {
    this.authService.logout();
      this.router.navigate(["/"])
  }

}
