import { Elysia, t } from 'elysia';

import { authConfig } from '@api/config/auth';
import { DomainError } from '@api/errors/domain-error';
import { authPlugin, type AuthJwtVerifier, resolveAuthSession } from '@api/modules/auth/plugin';
import { workspacesService, type WorkspacesServiceType } from '@api/modules/workspaces/service';
import {
  type CreateWorkspaceRequestBody,
  CreateWorkspaceRequestBodyModel,
  ErrorModel,
  WorkspacesModel,
  createSessionCookieModel,
} from '@flaptalk/api-contract';

const sessionCookieModel = createSessionCookieModel(authConfig.cookieName);
const WorkspaceParamsModel = t.Object({
  workspaceId: t.Numeric(),
});

async function requireAuthenticatedUserId(context: {
  readonly authJwt: AuthJwtVerifier;
  readonly cookie: Record<string, { value?: string | undefined }>;
}): Promise<number> {
  const authSession = await resolveAuthSession(context);

  if (!authSession) {
    throw new DomainError(401, 'auth_unauthorized', 'Authentication is required.');
  }

  return authSession.user.id;
}

export const workspacesModule = new Elysia({
  name: 'flaptalk.workspaces.routes',
  prefix: '/workspaces',
})
  .use(authPlugin)
  .use(workspacesService)
  .model(ErrorModel)
  .model(WorkspacesModel)
  .post(
    '/',
    async ({
      authJwt,
      body,
      cookie,
      workspacesService,
    }: {
      readonly authJwt: AuthJwtVerifier;
      readonly body: CreateWorkspaceRequestBody;
      readonly cookie: Record<string, { value?: string | undefined }>;
      readonly workspacesService: WorkspacesServiceType;
    }) => {
      const ownerId = await requireAuthenticatedUserId({ authJwt, cookie });

      return workspacesService.createWorkspace({
        ownerId,
        workspace: body,
      });
    },
    {
      body: CreateWorkspaceRequestBodyModel,
      cookie: sessionCookieModel,
      response: {
        200: 'workspaces.create.response',
        401: 'error.response',
      },
    },
  )
  .get(
    '/me',
    async ({
      authJwt,
      cookie,
      workspacesService,
    }: {
      readonly authJwt: AuthJwtVerifier;
      readonly cookie: Record<string, { value?: string | undefined }>;
      readonly workspacesService: WorkspacesServiceType;
    }) => {
      const userId = await requireAuthenticatedUserId({ authJwt, cookie });

      return workspacesService.listWorkspacesForMember(userId);
    },
    {
      cookie: sessionCookieModel,
      response: {
        200: 'workspaces.list.response',
        401: 'error.response',
      },
    },
  )
  .get(
    '/:workspaceId',
    async ({
      authJwt,
      cookie,
      params,
      workspacesService,
    }: {
      readonly authJwt: AuthJwtVerifier;
      readonly cookie: Record<string, { value?: string | undefined }>;
      readonly params: {
        readonly workspaceId: number;
      };
      readonly workspacesService: WorkspacesServiceType;
    }) => {
      const userId = await requireAuthenticatedUserId({ authJwt, cookie });

      return workspacesService.getWorkspaceForMember({
        userId,
        workspaceId: params.workspaceId,
      });
    },
    {
      cookie: sessionCookieModel,
      params: WorkspaceParamsModel,
      response: {
        200: 'workspaces.single.response',
        401: 'error.response',
        404: 'error.response',
      },
    },
  );
