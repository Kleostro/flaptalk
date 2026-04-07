import { inject, Injectable } from '@angular/core';

import { type AuthSubmissionResult } from '@web/app/features/auth/models/auth-submission-result.model';
import { AuthApiService } from '@web/app/features/auth/services/auth-api.service';
import { type LoginCredentials } from '@web/app/features/auth/types/login-credentials.model';
import { type RegistrationCredentials } from '@web/app/features/auth/types/registration-credentials.model';

@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
  private readonly authApiService = inject(AuthApiService);

  public login(credentials: LoginCredentials): Promise<AuthSubmissionResult> {
    return this.authApiService.login(credentials);
  }

  public register(credentials: RegistrationCredentials): Promise<AuthSubmissionResult> {
    return this.authApiService.register(credentials);
  }
}
