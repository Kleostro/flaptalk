import { Elysia } from 'elysia';

import { authPlugin, type AuthJwtVerifier } from '@api/modules/auth/plugin';
import { messagesService, type MessagesServiceType } from '@api/modules/messages/service';
import {
  MessageParamsModel,
  requireAuthenticatedUserId,
  RoomParamsModel,
  workspaceSessionCookieModel,
} from '@api/modules/workspaces/route-helpers';
import {
  type CreateMessageRequestBody,
  CreateMessageRequestBodyModel,
  ErrorModel,
  MessagesModel,
  type UpdateMessageRequestBody,
  UpdateMessageRequestBodyModel,
} from '@flaptalk/api-contract';

export const messagesModule = new Elysia({
  name: 'flaptalk.messages.routes',
})
  .use(authPlugin)
  .use(messagesService)
  .model(ErrorModel)
  .model(MessagesModel)
  .post(
    '/rooms/:roomId/messages',
    async ({
      authJwt,
      body,
      cookie,
      messagesService,
      params,
    }: {
      readonly authJwt: AuthJwtVerifier;
      readonly body: CreateMessageRequestBody;
      readonly cookie: Record<string, { value?: string | undefined }>;
      readonly messagesService: MessagesServiceType;
      readonly params: {
        readonly roomId: number;
      };
    }) => {
      const userId = await requireAuthenticatedUserId({ authJwt, cookie });

      return messagesService.createMessage({
        message: body,
        roomId: params.roomId,
        userId,
      });
    },
    {
      body: CreateMessageRequestBodyModel,
      cookie: workspaceSessionCookieModel,
      params: RoomParamsModel,
      response: {
        200: 'messages.create.response',
        401: 'error.response',
        404: 'error.response',
      },
    },
  )
  .get(
    '/rooms/:roomId/messages',
    async ({
      authJwt,
      cookie,
      messagesService,
      params,
    }: {
      readonly authJwt: AuthJwtVerifier;
      readonly cookie: Record<string, { value?: string | undefined }>;
      readonly messagesService: MessagesServiceType;
      readonly params: {
        readonly roomId: number;
      };
    }) => {
      const userId = await requireAuthenticatedUserId({ authJwt, cookie });

      return messagesService.listMessagesForRoomMember({
        roomId: params.roomId,
        userId,
      });
    },
    {
      cookie: workspaceSessionCookieModel,
      params: RoomParamsModel,
      response: {
        200: 'messages.list.response',
        401: 'error.response',
        404: 'error.response',
      },
    },
  )
  .get(
    '/messages/:messageId/thread',
    async ({
      authJwt,
      cookie,
      messagesService,
      params,
    }: {
      readonly authJwt: AuthJwtVerifier;
      readonly cookie: Record<string, { value?: string | undefined }>;
      readonly messagesService: MessagesServiceType;
      readonly params: {
        readonly messageId: number;
      };
    }) => {
      const userId = await requireAuthenticatedUserId({ authJwt, cookie });

      return messagesService.getThreadForMessageMember({
        messageId: params.messageId,
        userId,
      });
    },
    {
      cookie: workspaceSessionCookieModel,
      params: MessageParamsModel,
      response: {
        200: 'messages.thread.response',
        401: 'error.response',
        404: 'error.response',
      },
    },
  )
  .patch(
    '/messages/:messageId',
    async ({
      authJwt,
      body,
      cookie,
      messagesService,
      params,
    }: {
      readonly authJwt: AuthJwtVerifier;
      readonly body: UpdateMessageRequestBody;
      readonly cookie: Record<string, { value?: string | undefined }>;
      readonly messagesService: MessagesServiceType;
      readonly params: {
        readonly messageId: number;
      };
    }) => {
      const userId = await requireAuthenticatedUserId({ authJwt, cookie });

      return messagesService.updateMessage({
        message: body,
        messageId: params.messageId,
        userId,
      });
    },
    {
      body: UpdateMessageRequestBodyModel,
      cookie: workspaceSessionCookieModel,
      params: MessageParamsModel,
      response: {
        200: 'messages.update.response',
        401: 'error.response',
        403: 'error.response',
        404: 'error.response',
      },
    },
  )
  .delete(
    '/messages/:messageId',
    async ({
      authJwt,
      cookie,
      messagesService,
      params,
    }: {
      readonly authJwt: AuthJwtVerifier;
      readonly cookie: Record<string, { value?: string | undefined }>;
      readonly messagesService: MessagesServiceType;
      readonly params: {
        readonly messageId: number;
      };
    }) => {
      const userId = await requireAuthenticatedUserId({ authJwt, cookie });

      return messagesService.deleteMessage({
        messageId: params.messageId,
        userId,
      });
    },
    {
      cookie: workspaceSessionCookieModel,
      params: MessageParamsModel,
      response: {
        200: 'messages.delete.response',
        401: 'error.response',
        403: 'error.response',
        404: 'error.response',
      },
    },
  );
