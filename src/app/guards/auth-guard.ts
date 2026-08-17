import { CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService: AuthService = inject(AuthService);
  return !!authService.currentUser;
};
