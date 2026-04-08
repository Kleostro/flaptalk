import { Elysia } from 'elysia';

import { DomainError } from '@api/errors/domain-error';
import { ErrorModel } from '@api/models/error';
import { AUTH_ROUTE_TAG } from '@api/modules/auth/constants';
import {
  AuthModel,
  loginRequestBodyModel,
  registerRequestBodyModel,
  sessionCookieModel,
} from '@api/modules/auth/model';
import {
  authPlugin,
  clearAuthCookie,
  createAuthTokenPayload,
  setAuthCookie,
} from '@api/modules/auth/plugin';
import { authService } from '@api/modules/auth/service';
import type { AuthSession, LoginCredentials, RegisterCredentials } from '@api/modules/auth/types';

export const authModule = new Elysia({
  name: 'flaptalk.auth.routes',
  prefix: '/auth',
})
  .use(authPlugin)
  .model(ErrorModel)
  .model(AuthModel)
  .post(
    '/register',
    async ({
      authJwt,
      body,
      cookie,
    }: {
      readonly authJwt: { sign: (payload: Record<string, string>) => Promise<string> };
      readonly body: RegisterCredentials;
      readonly cookie: Record<string, { set: (options: Record<string, unknown>) => void }>;
    }) => {
      const authenticatedUser = await authService.register(body);
      const sessionToken = await authJwt.sign(createAuthTokenPayload(authenticatedUser.user));

      setAuthCookie(cookie, sessionToken);

      return authenticatedUser;
    },
    {
      body: registerRequestBodyModel,
      detail: {
        tags: [AUTH_ROUTE_TAG],
      },
      response: {
        200: 'auth.session.response',
        409: 'error.response',
      },
    },
  )
  .post(
    '/login',
    async ({
      authJwt,
      body,
      cookie,
    }: {
      readonly authJwt: { sign: (payload: Record<string, string>) => Promise<string> };
      readonly body: LoginCredentials;
      readonly cookie: Record<string, { set: (options: Record<string, unknown>) => void }>;
    }) => {
      const authenticatedUser = await authService.login(body);
      const sessionToken = await authJwt.sign(createAuthTokenPayload(authenticatedUser.user));

      setAuthCookie(cookie, sessionToken);

      return authenticatedUser;
    },
    {
      body: loginRequestBodyModel,
      detail: {
        tags: [AUTH_ROUTE_TAG],
      },
      response: {
        200: 'auth.session.response',
        401: 'error.response',
      },
    },
  )
  .get(
    '/me',
    async (context) => {
      const authSession = (
        context as typeof context & {
          readonly authSession?: AuthSession | null;
        }
      ).authSession;

      if (!authSession) {
        throw new DomainError(401, 'auth_unauthorized', 'Authentication is required.');
      }

      return {
        user: authSession.user,
      };
    },
    {
      cookie: sessionCookieModel,
      detail: {
        tags: [AUTH_ROUTE_TAG],
      },
      response: {
        200: 'auth.me.response',
        401: 'error.response',
      },
    },
  )
  .post(
    '/logout',
    ({ cookie }: { readonly cookie: Record<string, { remove: () => void }> }) => {
      clearAuthCookie(cookie);

      return {
        success: true as const,
      };
    },
    {
      cookie: sessionCookieModel,
      detail: {
        tags: [AUTH_ROUTE_TAG],
      },
      response: {
        200: 'auth.logout.response',
      },
    },
  );
