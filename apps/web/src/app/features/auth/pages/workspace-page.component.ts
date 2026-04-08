import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { ToastService } from '@web/app/core/services/toast.service';
import { AuthFacadeService } from '@web/app/features/auth/services/auth-facade.service';
import { ButtonComponent } from '@web/app/shared/ui/button/button';
import { CardComponent } from '@web/app/shared/ui/card/card';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, CardComponent, DatePipe],
  selector: 'app-workspace-page',
  styleUrl: './workspace-page.component.scss',
  templateUrl: './workspace-page.component.html',
})
export class WorkspacePageComponent {
  private readonly authFacadeService = inject(AuthFacadeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  public readonly isPending = computed(() => this.authFacadeService.isLogoutPending());
  public readonly user = computed(() => this.authFacadeService.user());

  public logout(): void {
    this.authFacadeService
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          this.toastService.error({
            message: 'We could not end the current session. Please try again.',
            title: 'Logout failed',
          });
        },
        next: (result) => {
          this.toastService.success(result);
          void this.router.navigateByUrl(`/${APP_ROUTE_PATHS.login}`);
        },
      });
  }
}
