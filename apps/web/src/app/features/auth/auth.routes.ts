import { Routes } from '@angular/router';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { LoginPageComponent } from '@web/app/features/auth/pages/login-page.component';
import { RegistrationPageComponent } from '@web/app/features/auth/pages/registration-page.component';

export const AUTH_ROUTES: Routes = [
  {
    path: APP_ROUTE_PATHS.root,
    pathMatch: 'full',
    redirectTo: APP_ROUTE_PATHS.login,
  },
  {
    component: LoginPageComponent,
    path: APP_ROUTE_PATHS.login,
  },
  {
    component: RegistrationPageComponent,
    path: APP_ROUTE_PATHS.register,
  },
];
