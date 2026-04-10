import { Routes } from '@angular/router';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { guestOnlyGuard } from '@web/app/features/auth/guards/guest-only.guard';
import { LoginPageComponent } from '@web/app/features/auth/pages/login-page.component';
import { RegistrationPageComponent } from '@web/app/features/auth/pages/registration-page.component';

export const AUTH_ROUTES: Routes = [
  {
    canActivate: [guestOnlyGuard],
    component: LoginPageComponent,
    path: APP_ROUTE_PATHS.login,
  },
  {
    canActivate: [guestOnlyGuard],
    component: RegistrationPageComponent,
    path: APP_ROUTE_PATHS.register,
  },
];
