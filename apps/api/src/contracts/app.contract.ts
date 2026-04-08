import { Elysia, t } from 'elysia';

import { ErrorModel } from '@api/models/error';

const contractPublicUserModel = t.Object({
  createdAt: t.String({
    format: 'date-time',
  }),
  email: t.String({
    format: 'email',
  }),
  id: t.Numeric(),
  updatedAt: t.String({
    format: 'date-time',
  }),
});

const contractAuthenticatedUserModel = t.Object({
  user: contractPublicUserModel,
});

const contractRegisterBodyModel = t.Object({
  email: t.String({
    format: 'email',
    maxLength: 320,
  }),
  password: t.String({
    maxLength: 72,
    minLength: 10,
  }),
});

const contractLoginBodyModel = t.Object({
  email: t.String({
    format: 'email',
    maxLength: 320,
  }),
  password: t.String({
    maxLength: 72,
    minLength: 1,
  }),
});

const contractSessionCookieModel = t.Cookie({
  flaptalk_session: t.Optional(t.String()),
});

const contractLogoutResponseModel = t.Object({
  success: t.Literal(true),
});

const contractHealthResponseModel = t.Object({
  service: t.String(),
  status: t.String(),
  timestamp: t.String({
    format: 'date-time',
  }),
  version: t.String(),
});

const contractReadyResponseModel = t.Object({
  checks: t.Object({
    database: t.String(),
  }),
  status: t.String(),
  timestamp: t.String({
    format: 'date-time',
  }),
});

const contractRootResponseModel = t.Object({
  name: t.String(),
  version: t.String(),
});

function createContractUser(): {
  readonly createdAt: string;
  readonly email: string;
  readonly id: number;
  readonly updatedAt: string;
} {
  return {
    createdAt: new Date(0).toISOString(),
    email: 'contract@flaptalk.app',
    id: 0,
    updatedAt: new Date(0).toISOString(),
  };
}

export const appContract = new Elysia({
  name: 'flaptalk.api.contract',
})
  .model(ErrorModel)
  .model({
    'auth.login.body': contractLoginBodyModel,
    'auth.logout.response': contractLogoutResponseModel,
    'auth.me.response': contractAuthenticatedUserModel,
    'auth.register.body': contractRegisterBodyModel,
    'auth.session.response': contractAuthenticatedUserModel,
    'users.entity': contractPublicUserModel,
    'users.list.response': t.Array(contractPublicUserModel),
  })
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
          cookie: contractSessionCookieModel,
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
          cookie: contractSessionCookieModel,
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
      response: contractHealthResponseModel,
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
        200: contractReadyResponseModel,
        503: contractReadyResponseModel,
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
      response: contractRootResponseModel,
    },
  );

export type AppContract = typeof appContract;
