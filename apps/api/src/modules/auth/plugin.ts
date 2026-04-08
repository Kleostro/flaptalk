import { jwt } from '@elysiajs/jwt';
import { Elysia } from 'elysia';

import { authConfig } from '@api/config/auth';
import { prisma } from '@api/db/prisma';
import { AUTH_TOKEN_TYPE } from '@api/modules/auth/constants';
import { serializeUser, publicUserSelect } from '@api/modules/users/public-user';

import type { AuthTokenPayload } from './types';
import type { AuthSession } from './types';

export interface AuthJwtVerifier {
  readonly verify: (token: string) => Promise<Record<string, unknown> | false>;
}

async function buildAuthSession(params: {
  readonly authJwt: AuthJwtVerifier;
  readonly cookie: Record<string, { value?: string | undefined }>;
}): Promise<AuthSession | null> {
  const authCookie = params.cookie[authConfig.cookieName];

  if (!authCookie?.value) {
    return null;
  }

  const sessionToken = authCookie.value;

  if (typeof sessionToken !== 'string') {
    return null;
  }

  const payload = (await params.authJwt.verify(sessionToken)) as AuthTokenPayload | false;

  if (!payload || payload.type !== AUTH_TOKEN_TYPE.session) {
    return null;
  }

  const userId = Number(payload.sub);

  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  const user = await prisma.user.findUnique({
    select: publicUserSelect,
    where: { id: userId },
  });

  if (!user) {
    return null;
  }

  return {
    user: serializeUser(user),
  };
}

export const authPlugin = new Elysia({
  name: 'flaptalk.auth',
}).use(
  jwt({
    exp: `${authConfig.sessionTtlSeconds}s`,
    name: authConfig.jwtDecoratorName,
    secret: authConfig.jwtSecret,
  }),
);

export const resolveAuthSession = buildAuthSession;

export function clearAuthCookie(cookie: Record<string, { remove: () => void }>): void {
  const authCookie = cookie[authConfig.cookieName];

  if (!authCookie) {
    return;
  }

  authCookie.remove();
}

export function createAuthTokenPayload(user: {
  readonly email: string;
  readonly id: number;
}): AuthTokenPayload {
  return {
    email: user.email,
    sub: String(user.id),
    type: AUTH_TOKEN_TYPE.session,
  };
}

export function setAuthCookie(
  cookie: Record<string, { set: (options: Record<string, unknown>) => void }>,
  token: string,
): void {
  const authCookie = cookie[authConfig.cookieName];

  if (!authCookie) {
    return;
  }

  authCookie.set({
    httpOnly: true,
    maxAge: authConfig.sessionTtlSeconds,
    path: authConfig.cookiePath,
    sameSite: 'lax',
    secure: authConfig.isSecureCookie,
    value: token,
  });
}
