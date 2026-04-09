import { t } from 'elysia';

import { authConfig } from '@api/config/auth';
import { DomainError } from '@api/errors/domain-error';
import { type AuthJwtVerifier, resolveAuthSession } from '@api/modules/auth/plugin';
import { createSessionCookieModel } from '@flaptalk/api-contract';

export const workspaceSessionCookieModel = createSessionCookieModel(authConfig.cookieName);

export const WorkspaceParamsModel = t.Object({
  workspaceId: t.Numeric(),
});

export async function requireAuthenticatedUserId(context: {
  readonly authJwt: AuthJwtVerifier;
  readonly cookie: Record<string, { value?: string | undefined }>;
}): Promise<number> {
  const authSession = await resolveAuthSession(context);

  if (!authSession) {
    throw new DomainError(401, 'auth_unauthorized', 'Authentication is required.');
  }

  return authSession.user.id;
}
