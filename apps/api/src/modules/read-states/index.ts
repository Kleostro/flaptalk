import { Elysia } from 'elysia';

import { authPlugin, type AuthJwtVerifier } from '@api/modules/auth/plugin';
import { readStatesService, type ReadStatesServiceType } from '@api/modules/read-states/service';
import {
  requireAuthenticatedUserId,
  RoomParamsModel,
  workspaceSessionCookieModel,
  WorkspaceParamsModel,
} from '@api/modules/workspaces/route-helpers';
import {
  ErrorModel,
  ReadStatesModel,
  type UpdateRoomReadStateRequestBody,
  UpdateRoomReadStateRequestBodyModel,
} from '@flaptalk/api-contract';

export const readStatesModule = new Elysia({
  name: 'flaptalk.readStates.routes',
})
  .use(authPlugin)
  .use(readStatesService)
  .model(ErrorModel)
  .model(ReadStatesModel)
  .post(
    '/rooms/:roomId/read',
    async ({
      authJwt,
      body,
      cookie,
      params,
      readStatesService,
    }: {
      readonly authJwt: AuthJwtVerifier;
      readonly body: UpdateRoomReadStateRequestBody;
      readonly cookie: Record<string, { value?: string | undefined }>;
      readonly params: {
        readonly roomId: number;
      };
      readonly readStatesService: ReadStatesServiceType;
    }) => {
      const userId = await requireAuthenticatedUserId({ authJwt, cookie });

      return readStatesService.updateRoomReadState({
        message: body,
        roomId: params.roomId,
        userId,
      });
    },
    {
      body: UpdateRoomReadStateRequestBodyModel,
      cookie: workspaceSessionCookieModel,
      params: RoomParamsModel,
      response: {
        200: 'readStates.update.response',
        401: 'error.response',
        404: 'error.response',
      },
    },
  )
  .get(
    '/workspaces/:workspaceId/activity',
    async ({
      authJwt,
      cookie,
      params,
      readStatesService,
    }: {
      readonly authJwt: AuthJwtVerifier;
      readonly cookie: Record<string, { value?: string | undefined }>;
      readonly params: {
        readonly workspaceId: number;
      };
      readonly readStatesService: ReadStatesServiceType;
    }) => {
      const userId = await requireAuthenticatedUserId({ authJwt, cookie });

      return readStatesService.getWorkspaceActivity({
        userId,
        workspaceId: params.workspaceId,
      });
    },
    {
      cookie: workspaceSessionCookieModel,
      params: WorkspaceParamsModel,
      response: {
        200: 'readStates.activity.response',
        401: 'error.response',
        404: 'error.response',
      },
    },
  );
