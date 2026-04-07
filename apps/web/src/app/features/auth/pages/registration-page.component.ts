import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { TOAST_LEVEL } from '@web/app/core/models/toast-level.type';
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
  private readonly authFacadeService = inject(AuthFacadeService);
  private readonly authFormFactoryService = inject(AuthFormFactoryService);
  private readonly toastService = inject(ToastService);

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
  public readonly isPending = signal(false);
  public readonly isSubmitted = signal(false);
  public readonly showErrors = computed(
    () => this.isSubmitted() || this.registrationForm().touched(),
  );

  private showToast(
    level: (typeof TOAST_LEVEL)[keyof typeof TOAST_LEVEL],
    title: string,
    message: string,
  ): void {
    if (level === TOAST_LEVEL.success) {
      this.toastService.success({ message, title });
      return;
    }

    if (level === TOAST_LEVEL.error) {
      this.toastService.error({ message, title });
      return;
    }

    this.toastService.info({ message, title });
  }

  public async submit(event: Event): Promise<void> {
    event.preventDefault();
    this.isSubmitted.set(true);

    if (this.isInvalid()) {
      this.toastService.error({
        message: 'Fix the highlighted fields before creating the account.',
        title: 'Form needs attention',
      });
      return;
    }

    this.isPending.set(true);

    try {
      const result = await this.authFacadeService.register(this.registrationModel());
      this.showToast(result.level, result.title, result.message);
    } catch {
      this.toastService.error({
        message: 'Something went wrong while preparing the registration flow.',
        title: 'Registration failed',
      });
    } finally {
      this.isPending.set(false);
    }
  }
}
