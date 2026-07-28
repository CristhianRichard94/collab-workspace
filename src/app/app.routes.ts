import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { Home } from './pages/home/home';

export const routes: Routes = [
  {
    path: 'boards/:id',
    loadComponent: () => import('./pages/board/board').then((m) => m.Board),
    canActivate: [authGuard],
  },
  {
    path: 'boards',
    loadComponent: () => import('./pages/boards/boards').then((m) => m.Boards),
    canActivate: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  { path: '', component:Home},
  { path: '**', redirectTo: '' },
];
