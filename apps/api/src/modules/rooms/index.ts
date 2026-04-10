import { Elysia } from 'elysia';

import { authPlugin, type AuthJwtVerifier } from '@api/modules/auth/plugin';
import { roomsService, type RoomsServiceType } from '@api/modules/rooms/service';
import {
  requireAuthenticatedUserId,
  workspaceSessionCookieModel,
  WorkspaceParamsModel,
} from '@api/modules/workspaces/route-helpers';
import {
  type CreateRoomRequestBody,
  CreateRoomRequestBodyModel,
  ErrorModel,
  RoomsModel,
} from '@flaptalk/api-contract';

export const roomsModule = new Elysia({
  name: 'flaptalk.rooms.routes',
  prefix: '/workspaces',
})
  .use(authPlugin)
  .use(roomsService)
  .model(ErrorModel)
  .model(RoomsModel)
  .post(
    '/:workspaceId/rooms',
    async ({
      authJwt,
      body,
      cookie,
      params,
      roomsService,
    }: {
      readonly authJwt: AuthJwtVerifier;
      readonly body: CreateRoomRequestBody;
      readonly cookie: Record<string, { value?: string | undefined }>;
      readonly params: {
        readonly workspaceId: number;
      };
      readonly roomsService: RoomsServiceType;
    }) => {
      const userId = await requireAuthenticatedUserId({ authJwt, cookie });

      return roomsService.createRoom({
        room: body,
        userId,
        workspaceId: params.workspaceId,
      });
    },
    {
      body: CreateRoomRequestBodyModel,
      cookie: workspaceSessionCookieModel,
      params: WorkspaceParamsModel,
      response: {
        200: 'rooms.create.response',
        401: 'error.response',
        403: 'error.response',
        404: 'error.response',
      },
    },
  )
  .get(
    '/:workspaceId/rooms',
    async ({
      authJwt,
      cookie,
      params,
      roomsService,
    }: {
      readonly authJwt: AuthJwtVerifier;
      readonly cookie: Record<string, { value?: string | undefined }>;
      readonly params: {
        readonly workspaceId: number;
      };
      readonly roomsService: RoomsServiceType;
    }) => {
      const userId = await requireAuthenticatedUserId({ authJwt, cookie });

      return roomsService.listRoomsForWorkspaceMember({
        userId,
        workspaceId: params.workspaceId,
      });
    },
    {
      cookie: workspaceSessionCookieModel,
      params: WorkspaceParamsModel,
      response: {
        200: 'rooms.list.response',
        401: 'error.response',
        404: 'error.response',
      },
    },
  );
