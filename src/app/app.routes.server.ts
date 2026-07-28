import { RenderMode, ServerRoute } from '@angular/ssr';
import { authGuard } from './guards/auth-guard';
import { Home } from './pages/home/home';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'boards',
    renderMode: RenderMode.Server,
  },
  {
    path: 'boards/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: 'login',
    renderMode: RenderMode.Server,
  },
  {
    path: '',
    renderMode: RenderMode.Prerender,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
