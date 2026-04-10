import { Elysia } from 'elysia';

import { authPlugin, type AuthJwtVerifier } from '@api/modules/auth/plugin';
import {
  requireAuthenticatedUserId,
  workspaceSessionCookieModel,
  WorkspaceParamsModel,
} from '@api/modules/workspaces/route-helpers';
import { workspacesService, type WorkspacesServiceType } from '@api/modules/workspaces/service';
import {
  type CreateInviteRequestBody,
  CreateInviteRequestBodyModel,
  type CreateWorkspaceRequestBody,
  CreateWorkspaceRequestBodyModel,
  ErrorModel,
  InvitesModel,
  WorkspacesModel,
} from '@flaptalk/api-contract';
import { invitesService, type InvitesServiceType } from '@api/modules/invites/service';

export const workspacesModule = new Elysia({
  name: 'flaptalk.workspaces.routes',
  prefix: '/workspaces',
})
  .use(authPlugin)
  .use(invitesService)
  .use(workspacesService)
  .model(ErrorModel)
  .model(InvitesModel)
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
  )
  .get(
    '/:workspaceId/members',
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

      return workspacesService.listWorkspaceMembers({
        userId,
        workspaceId: params.workspaceId,
      });
    },
    {
      cookie: workspaceSessionCookieModel,
      params: WorkspaceParamsModel,
      response: {
        200: 'workspaces.members.list.response',
        401: 'error.response',
        404: 'error.response',
      },
    },
  )
  .post(
    '/:workspaceId/invites',
    async ({
      authJwt,
      body,
      cookie,
      invitesService,
      params,
    }: {
      readonly authJwt: AuthJwtVerifier;
      readonly body: CreateInviteRequestBody;
      readonly cookie: Record<string, { value?: string | undefined }>;
      readonly invitesService: InvitesServiceType;
      readonly params: {
        readonly workspaceId: number;
      };
    }) => {
      const userId = await requireAuthenticatedUserId({ authJwt, cookie });

      return invitesService.createInvite({
        invite: body,
        userId,
        workspaceId: params.workspaceId,
      });
    },
    {
      body: CreateInviteRequestBodyModel,
      cookie: workspaceSessionCookieModel,
      params: WorkspaceParamsModel,
      response: {
        200: 'invites.create.response',
        401: 'error.response',
        403: 'error.response',
        404: 'error.response',
      },
    },
  )
  .get(
    '/:workspaceId/invites',
    async ({
      authJwt,
      cookie,
      invitesService,
      params,
    }: {
      readonly authJwt: AuthJwtVerifier;
      readonly cookie: Record<string, { value?: string | undefined }>;
      readonly invitesService: InvitesServiceType;
      readonly params: {
        readonly workspaceId: number;
      };
    }) => {
      const userId = await requireAuthenticatedUserId({ authJwt, cookie });

      return invitesService.listWorkspaceInvites({
        userId,
        workspaceId: params.workspaceId,
      });
    },
    {
      cookie: workspaceSessionCookieModel,
      params: WorkspaceParamsModel,
      response: {
        200: 'invites.list.response',
        401: 'error.response',
        403: 'error.response',
        404: 'error.response',
      },
    },
  );
