import { Injectable } from '@angular/core';

import { TOAST_LEVEL } from '@web/app/core/models/toast-level.type';
import { AUTH_FORM_LIMITS } from '@web/app/features/auth/constants/auth.constants';
import { type AuthSubmissionResult } from '@web/app/features/auth/models/auth-submission-result.model';
import { type LoginCredentials } from '@web/app/features/auth/types/login-credentials.model';
import { type RegistrationCredentials } from '@web/app/features/auth/types/registration-credentials.model';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private async waitForResponse(): Promise<void> {
    await new Promise((resolve) => {
      globalThis.setTimeout(resolve, AUTH_FORM_LIMITS.submissionDelayMs);
    });
  }

  public async login(_: LoginCredentials): Promise<AuthSubmissionResult> {
    await this.waitForResponse();

    return {
      level: TOAST_LEVEL.success,
      message: 'The login flow is ready to be connected to the backend endpoint.',
      title: 'Workspace access checked',
    };
  }

  public async register(_: RegistrationCredentials): Promise<AuthSubmissionResult> {
    await this.waitForResponse();

    return {
      level: TOAST_LEVEL.success,
      message: 'The registration flow is ready for the first backend auth integration.',
      title: 'Account scaffold created',
    };
  }
}
