import { computed, inject, Injectable, signal } from '@angular/core';
import { type PublicUser } from '@flaptalk/api-contract';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize, map, Observable, tap } from 'rxjs';

import { TOAST_LEVEL } from '@web/app/core/models/toast-level.type';
import { type AuthSubmissionResult } from '@web/app/features/auth/models/auth-submission-result.model';
import { AuthApiService } from '@web/app/features/auth/services/auth-api.service';
import { type LoginCredentials } from '@web/app/features/auth/types/login-credentials.model';
import { type RegistrationCredentials } from '@web/app/features/auth/types/registration-credentials.model';

@Injectable({ providedIn: 'root' })
export class AuthFacadeService {
  private readonly authApiService = inject(AuthApiService);
  private readonly loginPendingState = signal(false);
  private readonly logoutPendingState = signal(false);
  private readonly registerPendingState = signal(false);
  private readonly sessionRequestVersion = signal(0);
  private readonly sessionResource = rxResource<null | PublicUser, number>({
    defaultValue: null,
    params: () => this.sessionRequestVersion(),
    stream: () => this.authApiService.getCurrentUser(),
  });

  public readonly user = computed(() => this.sessionResource.value());
  public readonly isAuthenticated = computed(() => this.user() !== null);
  public readonly isLoginPending = computed(() => this.loginPendingState());
  public readonly isLogoutPending = computed(() => this.logoutPendingState());
  public readonly isRegisterPending = computed(() => this.registerPendingState());
  public readonly isMutationPending = computed(
    () => this.isLoginPending() || this.isLogoutPending() || this.isRegisterPending(),
  );
  public readonly isSessionPending = computed(() => this.sessionResource.isLoading());
  public readonly status = computed(() =>
    this.isSessionPending() ? 'loading' : this.isAuthenticated() ? 'authenticated' : 'anonymous',
  );

  public login(credentials: LoginCredentials): Observable<AuthSubmissionResult> {
    this.loginPendingState.set(true);

    return this.authApiService.login(credentials).pipe(
      tap((user) => {
        this.sessionResource.set(user);
      }),
      map((user) => ({
        level: TOAST_LEVEL.success,
        message: `Signed in as ${user.email}. Your workspace session is now active.`,
        title: 'Welcome back',
      })),
      finalize(() => {
        this.loginPendingState.set(false);
      }),
    );
  }

  public logout(): Observable<AuthSubmissionResult> {
    this.logoutPendingState.set(true);

    return this.authApiService.logout().pipe(
      tap(() => {
        this.sessionResource.set(null);
      }),
      map(() => ({
        level: TOAST_LEVEL.success,
        message: 'The current session was closed and the auth cookie was cleared.',
        title: 'Logged out',
      })),
      finalize(() => {
        this.logoutPendingState.set(false);
      }),
    );
  }

  public refreshSession(): boolean {
    this.sessionRequestVersion.update((version) => version + 1);
    return true;
  }

  public register(credentials: RegistrationCredentials): Observable<AuthSubmissionResult> {
    this.registerPendingState.set(true);

    return this.authApiService.register(credentials).pipe(
      tap((user) => {
        this.sessionResource.set(user);
      }),
      map((user) => ({
        level: TOAST_LEVEL.success,
        message: `Account created for ${user.email}. Your session is ready to use.`,
        title: 'Account created',
      })),
      finalize(() => {
        this.registerPendingState.set(false);
      }),
    );
  }
}
