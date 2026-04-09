import { Routes } from '@angular/router';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { authRequiredGuard } from '@web/app/features/auth/guards/auth-required.guard';
import { WorkspacePageComponent } from '@web/app/features/workspaces/pages/workspace-page.component';

export const routes: Routes = [
  {
    path: APP_ROUTE_PATHS.root,
    pathMatch: 'full',
    redirectTo: APP_ROUTE_PATHS.workspace,
  },
  {
    canActivate: [authRequiredGuard],
    component: WorkspacePageComponent,
    path: APP_ROUTE_PATHS.workspace,
  },
  {
    loadChildren: () =>
      import('@web/app/features/auth/auth.routes').then((module) => module.AUTH_ROUTES),
    path: APP_ROUTE_PATHS.root,
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: APP_ROUTE_PATHS.root,
  },
];
