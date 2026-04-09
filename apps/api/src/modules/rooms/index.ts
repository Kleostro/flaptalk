import { Elysia, t } from 'elysia';

import { authConfig } from '@api/config/auth';
import { DomainError } from '@api/errors/domain-error';
import { authPlugin, type AuthJwtVerifier, resolveAuthSession } from '@api/modules/auth/plugin';
import { roomsService, type RoomsServiceType } from '@api/modules/rooms/service';
import {
  type CreateRoomRequestBody,
  CreateRoomRequestBodyModel,
  ErrorModel,
  RoomsModel,
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
      cookie: sessionCookieModel,
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
      cookie: sessionCookieModel,
      params: WorkspaceParamsModel,
      response: {
        200: 'rooms.list.response',
        401: 'error.response',
        404: 'error.response',
      },
    },
  );
