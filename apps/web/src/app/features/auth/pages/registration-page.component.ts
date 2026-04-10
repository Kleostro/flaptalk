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
import { RegistrationFormComponent } from '@web/app/features/auth/components/registration-form/registration-form.component';
import { type AuthPageContent } from '@web/app/features/auth/models/auth-page-content.model';
import { AuthFacadeService } from '@web/app/features/auth/services/auth-facade.service';
import { AuthFormFactoryService } from '@web/app/features/auth/services/auth-form.factory.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuthPageShellComponent, RegistrationFormComponent],
  selector: 'app-registration-page',
  templateUrl: './registration-page.component.html',
})
export class RegistrationPageComponent {
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
  public readonly registrationModel = this.authFormFactoryService.createRegistrationModel();
  public readonly passwordMismatch = computed(
    () =>
      this.registrationModel().password.length > 0 &&
      this.registrationModel().confirmPassword.length > 0 &&
      this.registrationModel().password !== this.registrationModel().confirmPassword,
  );
  public readonly confirmPasswordErrors = computed(() =>
    this.passwordMismatch() ? ['Passwords must match.'] : [],
  );
  public readonly content: AuthPageContent = AUTH_PAGE_CONTENT.registration;
  public readonly registrationForm = this.authFormFactoryService.createRegistrationForm(
    this.registrationModel,
  );
  public readonly isInvalid = computed(
    () => this.registrationForm().invalid() || this.passwordMismatch(),
  );
  public readonly isPending = computed(() => this.authFacadeService.isRegisterPending());
  public readonly isSubmitted = signal(false);
  public readonly showErrors = computed(
    () => this.isSubmitted() || this.registrationForm().touched(),
  );

  public submit(event: Event): void {
    event.preventDefault();
    this.isSubmitted.set(true);

    if (this.isInvalid()) {
      this.toastService.error({
        message: 'Fix the highlighted fields before creating the account.',
        title: 'Form needs attention',
      });
      return;
    }

    this.authFacadeService
      .register(this.registrationModel())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.toastService.error({
            message:
              error instanceof Error
                ? error.message
                : 'Something went wrong while preparing the registration flow.',
            title: 'Registration failed',
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
