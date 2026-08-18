import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme';

@Component({
  selector: 'app-theme-switch',
  templateUrl: './theme-switch.html',
  styleUrl: './theme-switch.css',
})
export class ThemeSwitch {
  themeService = inject(ThemeService);
}
