import { Elysia, t } from 'elysia';

import { AuthModel, createSessionCookieModel } from './models/auth';
import { ErrorModel } from './models/error';
import { InvitesModel } from './models/invites';
import { MessagesModel } from './models/messages';
import { ReadStatesModel } from './models/read-states';
import { RoomsModel } from './models/rooms';
import { UsersModel } from './models/users';
import { WorkspacesModel } from './models/workspaces';

function createContractUser() {
  return {
    createdAt: new Date(0).toISOString(),
    email: 'contract@flaptalk.app',
    id: 0,
    updatedAt: new Date(0).toISOString(),
  };
}

function createContractWorkspace() {
  return {
    createdAt: new Date(0).toISOString(),
    description: 'Private community for structured discussions.',
    id: 0,
    name: 'FlapTalk Founders',
    ownerId: 0,
    slug: 'flaptalk-founders',
    updatedAt: new Date(0).toISOString(),
  };
}

function createContractRoom() {
  return {
    createdAt: new Date(0).toISOString(),
    description: 'Structured room for updates and focused discussion.',
    id: 0,
    name: 'General',
    slug: 'general',
    updatedAt: new Date(0).toISOString(),
    workspaceId: 0,
  };
}

function createContractMessage() {
  return {
    author: createContractUser(),
    body: 'Welcome to the room. The first discussion can start here.',
    createdAt: new Date(0).toISOString(),
    id: 0,
    parentMessageId: null,
    roomId: 0,
    updatedAt: new Date(0).toISOString(),
  };
}

function createContractReadState() {
  return {
    lastReadMessageId: 0,
    roomId: 0,
    updatedAt: new Date(0).toISOString(),
    userId: 0,
  };
}

function createContractCatchUpItem() {
  return {
    contextType: 'thread_reply' as const,
    firstUnreadMessage: createContractMessage(),
    lastActivityAt: new Date(0).toISOString(),
    lastAuthor: createContractUser(),
    lastMessage: createContractMessage(),
    preview: 'A thread continuation is waiting in this room.',
    resumeMode: 'unread' as const,
    resumeTargetMessageId: 0,
    room: createContractRoom(),
    threadRootMessage: createContractMessage(),
    threadRootMessageId: 0,
    unreadMessageCount: 3,
  };
}

function createContractInvite() {
  return {
    createdAt: new Date(0).toISOString(),
    createdById: 0,
    email: 'invitee@flaptalk.app',
    expiresAt: new Date(72 * 60 * 60 * 1000).toISOString(),
    id: 0,
    token: 'invite_token',
    usedAt: null,
    workspaceId: 0,
  };
}

function createContractWorkspaceMember() {
  return {
    id: 0,
    joinedAt: new Date(0).toISOString(),
    role: 'owner' as const,
    user: createContractUser(),
  };
}

const sessionCookieModel = createSessionCookieModel();

const HealthResponseModel = t.Object({
  service: t.String(),
  status: t.String(),
  timestamp: t.String({
    format: 'date-time',
  }),
  version: t.String(),
});

const ReadyResponseModel = t.Object({
  checks: t.Object({
    database: t.String(),
  }),
  status: t.String(),
  timestamp: t.String({
    format: 'date-time',
  }),
});

const RootResponseModel = t.Object({
  name: t.String(),
  version: t.String(),
});

export const appContract = new Elysia({
  name: 'flaptalk.api.contract',
})
  .model(ErrorModel)
  .model(AuthModel)
  .model(InvitesModel)
  .model(MessagesModel)
  .model(ReadStatesModel)
  .model(UsersModel)
  .model(WorkspacesModel)
  .model(RoomsModel)
  .group('/auth', (app) =>
    app
      .post(
        '/register',
        () => ({
          user: createContractUser(),
        }),
        {
          body: 'auth.register.body',
          response: {
            200: 'auth.session.response',
            409: 'error.response',
          },
        },
      )
      .post(
        '/login',
        () => ({
          user: createContractUser(),
        }),
        {
          body: 'auth.login.body',
          response: {
            200: 'auth.session.response',
            401: 'error.response',
          },
        },
      )
      .get(
        '/me',
        () => ({
          user: createContractUser(),
        }),
        {
          cookie: sessionCookieModel,
          response: {
            200: 'auth.me.response',
            401: 'error.response',
          },
        },
      )
      .post(
        '/logout',
        () => ({
          success: true as const,
        }),
        {
          cookie: sessionCookieModel,
          response: {
            200: 'auth.logout.response',
          },
        },
      ),
  )
  .group('/users', (app) =>
    app.get('/', () => [createContractUser()], {
      response: {
        200: 'users.list.response',
      },
    }),
  )
  .group('/workspaces', (app) =>
    app
      .post(
        '/',
        () => ({
          role: 'owner' as const,
          workspace: createContractWorkspace(),
        }),
        {
          body: 'workspaces.create.body',
          cookie: sessionCookieModel,
          response: {
            200: 'workspaces.create.response',
            401: 'error.response',
          },
        },
      )
      .get(
        '/me',
        () => ({
          workspaces: [
            {
              role: 'owner' as const,
              workspace: createContractWorkspace(),
            },
          ],
        }),
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
        () => ({
          role: 'owner' as const,
          workspace: createContractWorkspace(),
        }),
        {
          cookie: sessionCookieModel,
          params: t.Object({
            workspaceId: t.Numeric(),
          }),
          response: {
            200: 'workspaces.single.response',
            401: 'error.response',
            404: 'error.response',
          },
        },
      )
      .get(
        '/:workspaceId/members',
        () => ({
          members: [createContractWorkspaceMember()],
        }),
        {
          cookie: sessionCookieModel,
          params: t.Object({
            workspaceId: t.Numeric(),
          }),
          response: {
            200: 'workspaces.members.list.response',
            401: 'error.response',
            404: 'error.response',
          },
        },
      )
      .delete(
        '/:workspaceId/members/:memberId',
        () => ({
          success: true as const,
        }),
        {
          cookie: sessionCookieModel,
          params: t.Object({
            memberId: t.Numeric(),
            workspaceId: t.Numeric(),
          }),
          response: {
            200: 'workspaces.members.remove.response',
            401: 'error.response',
            403: 'error.response',
            404: 'error.response',
            409: 'error.response',
          },
        },
      )
      .delete(
        '/:workspaceId/members/me',
        () => ({
          success: true as const,
        }),
        {
          cookie: sessionCookieModel,
          params: t.Object({
            workspaceId: t.Numeric(),
          }),
          response: {
            200: 'workspaces.members.leave.response',
            401: 'error.response',
            404: 'error.response',
            409: 'error.response',
          },
        },
      )
      .post('/:workspaceId/invites', () => createContractInvite(), {
        body: 'invites.create.body',
        cookie: sessionCookieModel,
        params: t.Object({
          workspaceId: t.Numeric(),
        }),
        response: {
          200: 'invites.create.response',
          401: 'error.response',
          403: 'error.response',
          404: 'error.response',
        },
      })
      .delete(
        '/:workspaceId/invites/:inviteId',
        () => ({
          success: true as const,
        }),
        {
          cookie: sessionCookieModel,
          params: t.Object({
            inviteId: t.Numeric(),
            workspaceId: t.Numeric(),
          }),
          response: {
            200: 'invites.revoke.response',
            401: 'error.response',
            403: 'error.response',
            404: 'error.response',
          },
        },
      )
      .get(
        '/:workspaceId/invites',
        () => ({
          invites: [createContractInvite()],
        }),
        {
          cookie: sessionCookieModel,
          params: t.Object({
            workspaceId: t.Numeric(),
          }),
          response: {
            200: 'invites.list.response',
            401: 'error.response',
            403: 'error.response',
            404: 'error.response',
          },
        },
      )
      .post('/:workspaceId/rooms', () => createContractRoom(), {
        body: 'rooms.create.body',
        cookie: sessionCookieModel,
        params: t.Object({
          workspaceId: t.Numeric(),
        }),
        response: {
          200: 'rooms.create.response',
          401: 'error.response',
          403: 'error.response',
          404: 'error.response',
        },
      })
      .get(
        '/:workspaceId/rooms',
        () => ({
          rooms: [createContractRoom()],
        }),
        {
          cookie: sessionCookieModel,
          params: t.Object({
            workspaceId: t.Numeric(),
          }),
          response: {
            200: 'rooms.list.response',
            401: 'error.response',
            404: 'error.response',
          },
        },
      ),
  )
  .group('/invites', (app) =>
    app
      .get(
        '/:token',
        () => ({
          expiresAt: new Date(72 * 60 * 60 * 1000).toISOString(),
          invite: createContractInvite(),
          isExpired: false,
          isUsed: false,
          workspace: createContractWorkspace(),
        }),
        {
          params: t.Object({
            token: t.String(),
          }),
          response: {
            200: 'invites.preview.response',
            404: 'error.response',
          },
        },
      )
      .post(
        '/:token/accept',
        () => ({
          role: 'member' as const,
          workspace: createContractWorkspace(),
        }),
        {
          cookie: sessionCookieModel,
          params: t.Object({
            token: t.String(),
          }),
          response: {
            200: 'invites.accept.response',
            401: 'error.response',
            403: 'error.response',
            404: 'error.response',
            409: 'error.response',
          },
        },
      ),
  )
  .group('/workspaces', (app) =>
    app
      .get(
        '/:workspaceId/activity',
        () => ({
          rooms: [
            {
              lastMessage: createContractMessage(),
              readState: createContractReadState(),
              room: createContractRoom(),
              unreadMessageCount: 3,
            },
          ],
          unreadMessageCount: 3,
          unreadRoomCount: 1,
        }),
        {
          cookie: sessionCookieModel,
          params: t.Object({
            workspaceId: t.Numeric(),
          }),
          response: {
            200: 'readStates.activity.response',
            401: 'error.response',
            404: 'error.response',
          },
        },
      )
      .get(
        '/:workspaceId/catch-up',
        () => ({
          items: [createContractCatchUpItem()],
          primaryItem: createContractCatchUpItem(),
        }),
        {
          cookie: sessionCookieModel,
          params: t.Object({
            workspaceId: t.Numeric(),
          }),
          response: {
            200: 'readStates.catchUp.response',
            401: 'error.response',
            404: 'error.response',
          },
        },
      ),
  )
  .group('/rooms', (app) =>
    app
      .post('/:roomId/messages', () => createContractMessage(), {
        body: 'messages.create.body',
        cookie: sessionCookieModel,
        params: t.Object({
          roomId: t.Numeric(),
        }),
        response: {
          200: 'messages.create.response',
          401: 'error.response',
          404: 'error.response',
        },
      })
      .get(
        '/:roomId/messages',
        () => ({
          messages: [createContractMessage()],
        }),
        {
          cookie: sessionCookieModel,
          params: t.Object({
            roomId: t.Numeric(),
          }),
          response: {
            200: 'messages.list.response',
            401: 'error.response',
            404: 'error.response',
          },
        },
      )
      .post('/:roomId/read', () => createContractReadState(), {
        body: 'readStates.update.body',
        cookie: sessionCookieModel,
        params: t.Object({
          roomId: t.Numeric(),
        }),
        response: {
          200: 'readStates.update.response',
          401: 'error.response',
          404: 'error.response',
        },
      }),
  )
  .group('/messages', (app) =>
    app
      .get(
        '/:messageId/thread',
        () => ({
          replies: [createContractMessage()],
          rootMessage: createContractMessage(),
        }),
        {
          cookie: sessionCookieModel,
          params: t.Object({
            messageId: t.Numeric(),
          }),
          response: {
            200: 'messages.thread.response',
            401: 'error.response',
            404: 'error.response',
          },
        },
      )
      .patch('/:messageId', () => createContractMessage(), {
        body: 'messages.update.body',
        cookie: sessionCookieModel,
        params: t.Object({
          messageId: t.Numeric(),
        }),
        response: {
          200: 'messages.update.response',
          401: 'error.response',
          403: 'error.response',
          404: 'error.response',
        },
      })
      .delete(
        '/:messageId',
        () => ({
          success: true as const,
        }),
        {
          cookie: sessionCookieModel,
          params: t.Object({
            messageId: t.Numeric(),
          }),
          response: {
            200: 'messages.delete.response',
            401: 'error.response',
            403: 'error.response',
            404: 'error.response',
          },
        },
      ),
  )
  .get(
    '/health',
    () => ({
      service: 'flaptalk-api',
      status: 'ok',
      timestamp: new Date(0).toISOString(),
      version: '0.1.0',
    }),
    {
      response: HealthResponseModel,
    },
  )
  .get(
    '/ready',
    () => ({
      checks: {
        database: 'ok',
      },
      status: 'ok',
      timestamp: new Date(0).toISOString(),
    }),
    {
      response: {
        200: ReadyResponseModel,
        503: ReadyResponseModel,
      },
    },
  )
  .get(
    '/',
    () => ({
      name: 'FlapTalk API',
      version: '0.1.0',
    }),
    {
      response: RootResponseModel,
    },
  );

export type AppContract = typeof appContract;
