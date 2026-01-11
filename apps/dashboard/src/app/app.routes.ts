import { Route } from '@angular/router';
import { authGuard, guestGuard } from './guards';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/layout').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('./pages/dashboard/task-list').then((m) => m.TaskListComponent),
      },
      {
        path: 'board',
        loadComponent: () =>
          import('./pages/dashboard/task-board').then((m) => m.TaskBoardComponent),
      },
      {
        path: 'audit-log',
        loadComponent: () =>
          import('./pages/audit-log').then((m) => m.AuditLogComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile').then((m) => m.ProfileComponent),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
