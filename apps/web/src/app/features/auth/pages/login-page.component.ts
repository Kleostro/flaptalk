import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { TOAST_LEVEL } from '@web/app/core/models/toast-level.type';
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
  private readonly authFacadeService = inject(AuthFacadeService);
  private readonly authFormFactoryService = inject(AuthFormFactoryService);
  private readonly toastService = inject(ToastService);

  public readonly content: AuthPageContent = AUTH_PAGE_CONTENT.login;
  public readonly loginModel = this.authFormFactoryService.createLoginModel();
  public readonly loginForm = this.authFormFactoryService.createLoginForm(this.loginModel);
  public readonly isInvalid = computed(() => this.loginForm().invalid());
  public readonly isPending = signal(false);
  public readonly isSubmitted = signal(false);
  public readonly showErrors = computed(() => this.isSubmitted() || this.loginForm().touched());

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
        message: 'Review the highlighted fields before continuing.',
        title: 'Incomplete form',
      });
      return;
    }

    this.isPending.set(true);

    try {
      const result = await this.authFacadeService.login(this.loginModel());
      this.showToast(result.level, result.title, result.message);
    } catch {
      this.toastService.error({
        message: 'Something went wrong while checking your workspace access.',
        title: 'Login failed',
      });
    } finally {
      this.isPending.set(false);
    }
  }
}
