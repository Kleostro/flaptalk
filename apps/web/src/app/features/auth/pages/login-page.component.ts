import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, Router } from '@angular/router';

import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { ToastService } from '@web/app/core/services/toast.service';
import { AUTH_PAGE_CONTENT } from '@web/app/features/auth/constants/auth.constants';
import { AuthPageShellComponent } from '@web/app/features/auth/components/auth-page-shell/auth-page-shell.component';
import { LoginFormComponent } from '@web/app/features/auth/components/login-form/login-form.component';
import { type AuthPageContent } from '@web/app/features/auth/models/auth-page-content.model';
import { AuthFacadeService } from '@web/app/features/auth/services/auth-facade.service';
import { AuthFormFactoryService } from '@web/app/features/auth/services/auth-form.factory.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuthPageShellComponent, LoginFormComponent],
  selector: 'app-login-page',
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly authFacadeService = inject(AuthFacadeService);
  private readonly authFormFactoryService = inject(AuthFormFactoryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  public readonly alternateActionQueryParams = computed<null | Params>(() => {
    const redirectTo = this.activatedRoute.snapshot.queryParamMap.get('redirectTo');

    return redirectTo ? { redirectTo } : null;
  });
  public readonly content: AuthPageContent = AUTH_PAGE_CONTENT.login;
  public readonly loginModel = this.authFormFactoryService.createLoginModel();
  public readonly loginForm = this.authFormFactoryService.createLoginForm(this.loginModel);
  public readonly isInvalid = computed(() => this.loginForm().invalid());
  public readonly isPending = computed(() => this.authFacadeService.isLoginPending());
  public readonly isSubmitted = signal(false);
  public readonly showErrors = computed(() => this.isSubmitted() || this.loginForm().touched());

  public submit(event: Event): void {
    event.preventDefault();
    this.isSubmitted.set(true);

    if (this.isInvalid()) {
      this.toastService.error({
        message: 'Review the highlighted fields before continuing.',
        title: 'Incomplete form',
      });
      return;
    }

    this.authFacadeService
      .login(this.loginModel())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.toastService.error({
            message:
              error instanceof Error
                ? error.message
                : 'Something went wrong while checking your workspace access.',
            title: 'Login failed',
          });
        },
        next: (result) => {
          this.toastService.success(result);
          void this.router.navigateByUrl(
            this.activatedRoute.snapshot.queryParamMap.get('redirectTo') ??
              `/${APP_ROUTE_PATHS.workspace}`,
          );
        },
      });
  }
}
