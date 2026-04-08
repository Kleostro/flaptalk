import { computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, take } from 'rxjs';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { AuthFacadeService } from '@web/app/features/auth/services/auth-facade.service';

export const authRequiredGuard: CanActivateFn = () => {
  const authFacadeService = inject(AuthFacadeService);
  const router = inject(Router);

  return toObservable(
    computed(() => {
      if (authFacadeService.isSessionPending()) {
        return undefined;
      }

      return authFacadeService.isAuthenticated()
        ? true
        : router.createUrlTree([`/${APP_ROUTE_PATHS.login}`]);
    }),
  ).pipe(
    filter((result): result is ReturnType<Router['createUrlTree']> | true => result !== undefined),
    take(1),
  );
};
