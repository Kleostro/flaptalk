import { Elysia } from 'elysia';

import { authPlugin, type AuthJwtVerifier } from '@api/modules/auth/plugin';
import {
  requireAuthenticatedUserId,
  workspaceSessionCookieModel,
  WorkspaceParamsModel,
} from '@api/modules/workspaces/route-helpers';
import { workspacesService, type WorkspacesServiceType } from '@api/modules/workspaces/service';
import {
  type CreateWorkspaceRequestBody,
  CreateWorkspaceRequestBodyModel,
  ErrorModel,
  WorkspacesModel,
} from '@flaptalk/api-contract';

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
      cookie: workspaceSessionCookieModel,
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
      cookie: workspaceSessionCookieModel,
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
      cookie: workspaceSessionCookieModel,
      params: WorkspaceParamsModel,
      response: {
        200: 'workspaces.single.response',
        401: 'error.response',
        404: 'error.response',
      },
    },
  );
