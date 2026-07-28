import { CanActivateFn } from '@angular/router';
import { UserService } from '../services/user';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const userService: UserService = inject(UserService);
  return !!userService.currentUser;
};
