import { Elysia, t } from 'elysia';

import { AuthModel, createSessionCookieModel } from '@flaptalk/api-contract/models/auth';
import { ErrorModel } from '@flaptalk/api-contract/models/error';
import { UsersModel } from '@flaptalk/api-contract/models/users';

function createContractUser() {
  return {
    createdAt: new Date(0).toISOString(),
    email: 'contract@flaptalk.app',
    id: 0,
    updatedAt: new Date(0).toISOString(),
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
  .model(UsersModel)
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
