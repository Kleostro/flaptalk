import { Injectable } from '@angular/core';
import { type PublicUser } from '@flaptalk/api-contract';
import { defer, from, map, Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { api } from '@web/app/api.config';
import { type LoginCredentials } from '@web/app/features/auth/types/login-credentials.model';
import { type RegistrationCredentials } from '@web/app/features/auth/types/registration-credentials.model';

const UNAUTHORIZED_STATUS = 401;

interface ApiErrorValue {
  readonly message?: string;
  readonly summary?: string;
}

interface ApiResponse<TData> {
  readonly data?: TData;
  readonly error?: null | {
    readonly status?: number;
    readonly value?: ApiErrorValue;
  };
  readonly status?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private createRequest$<TData, TResult>(
    request: () => Promise<ApiResponse<TData>>,
    project: (response: ApiResponse<TData>) => TResult,
    fallbackMessage: string,
  ): Observable<TResult> {
    return defer(() => from(request())).pipe(
      map(project),
      catchError((error: unknown) =>
        throwError(() => (error instanceof Error ? error : new Error(fallbackMessage))),
      ),
    );
  }

  private getErrorMessage(
    response: ApiResponse<unknown>,
    fallbackMessage: string,
    defaultUnauthorizedMessage = 'Authentication is required.',
  ): string {
    if (response.error?.value?.message) {
      return response.error.value.message;
    }

    if (response.error?.value?.summary) {
      return response.error.value.summary;
    }

    if (response.status === UNAUTHORIZED_STATUS) {
      return defaultUnauthorizedMessage;
    }

    return fallbackMessage;
  }

  public getCurrentUser(): Observable<null | PublicUser> {
    return this.createRequest$(
      () => api.auth.me.get(),
      (response) => {
        if (response.data?.user) {
          return response.data.user;
        }

        if (response.status === UNAUTHORIZED_STATUS) {
          return null;
        }

        throw new Error(
          this.getErrorMessage(response, 'Unable to restore the current workspace session.'),
        );
      },
      'Unable to restore the current workspace session.',
    );
  }

  public login(credentials: LoginCredentials): Observable<PublicUser> {
    return this.createRequest$(
      () => api.auth.login.post(credentials),
      (response) => {
        if (response.data?.user) {
          return response.data.user;
        }

        throw new Error(
          this.getErrorMessage(response, 'Unable to log in with the provided credentials.'),
        );
      },
      'Unable to log in with the provided credentials.',
    );
  }

  public logout(): Observable<void> {
    return this.createRequest$(
      () => api.auth.logout.post({}),
      (response) => {
        if (response.data?.success) {
          return;
        }

        throw new Error(
          this.getErrorMessage(response, 'Unable to log out from the current session.'),
        );
      },
      'Unable to log out from the current session.',
    );
  }

  public register(credentials: RegistrationCredentials): Observable<PublicUser> {
    return this.createRequest$(
      () =>
        api.auth.register.post({
          email: credentials.email,
          password: credentials.password,
        }),
      (response) => {
        if (response.data?.user) {
          return response.data.user;
        }

        throw new Error(
          this.getErrorMessage(response, 'Unable to create an account with the provided details.'),
        );
      },
      'Unable to create an account with the provided details.',
    );
  }
}
