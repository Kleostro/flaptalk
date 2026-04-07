import { Routes } from '@angular/router';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';

export const routes: Routes = [
  {
    loadChildren: () =>
      import('@web/app/features/auth/auth.routes').then((module) => module.AUTH_ROUTES),
    path: APP_ROUTE_PATHS.root,
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: APP_ROUTE_PATHS.login,
  },
];
