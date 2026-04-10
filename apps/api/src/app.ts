import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import { ErrorModel } from '@flaptalk/api-contract';

import { DomainError } from './errors/domain-error';
import { authModule } from './modules/auth';
import { invitesModule } from './modules/invites';
import { messagesModule } from './modules/messages';
import { readStatesModule } from './modules/read-states';
import { roomsModule } from './modules/rooms';
import { usersModule } from './modules/users';
import { workspacesModule } from './modules/workspaces';
import { logger } from './observability/logger';
import { prismaPlugin } from './plugins/prisma';

const localhostOrigins = [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/];

const allowedOrigins = (process.env['WEB_ORIGIN'] ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const createApp = () =>
  new Elysia({
    name: 'flaptalk.api',
  })
    .model(ErrorModel)
    .decorate('logger', logger)
    .use(prismaPlugin)
    .derive(({ request }) => ({
      requestId: crypto.randomUUID(),
      requestPath: new URL(request.url).pathname,
      requestStartedAt: Date.now(),
    }))
    .onRequest(({ request, requestId, requestPath }: any) => {
      logger.info('http.request.started', {
        method: request.method,
        path: requestPath,
        requestId,
      });
    })
    .use(
      cors({
        origin: [...localhostOrigins, ...allowedOrigins],
        credentials: true,
      }),
    )
    .use(
      swagger({
        documentation: {
          info: {
            title: 'FlapTalk API',
            version: '0.1.0',
            description: 'FlapTalk',
          },
        },
      }),
    )
    .onAfterHandle(({ request, requestId, requestPath, requestStartedAt, set }) => {
      logger.info('http.request.completed', {
        durationMs: Date.now() - requestStartedAt,
        method: request.method,
        path: requestPath,
        requestId,
        status: typeof set.status === 'number' ? set.status : 200,
      });
    })
    .onError(({ error, code, set, request, requestId, requestPath, requestStartedAt }: any) => {
      const status =
        error instanceof DomainError ? error.status : code === 'VALIDATION' ? 400 : 500;

      logger.error('http.request.failed', {
        code,
        durationMs: Date.now() - requestStartedAt,
        error,
        method: request.method,
        path: requestPath,
        requestId,
        status,
      });

      if (error instanceof DomainError) {
        set.status = error.status;

        return {
          code: error.code,
          message: error.message,
        };
      }

      if (code === 'VALIDATION') {
        set.status = 400;

        return {
          code: 'validation_error',
          message: error.message,
        };
      }

      return undefined;
    })
    .use(authModule)
    .use(invitesModule)
    .use(messagesModule)
    .use(readStatesModule)
    .use(usersModule)
    .use(workspacesModule)
    .use(roomsModule)
    .get('/health', () => ({
      service: 'flaptalk-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    }))
    .get('/ready', async ({ prisma, set }) => {
      try {
        await prisma.$queryRawUnsafe('SELECT 1');

        return {
          checks: {
            database: 'ok',
          },
          status: 'ok',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        set.status = 503;

        logger.error('app.readiness.failed', {
          error,
        });

        return {
          checks: {
            database: 'error',
          },
          status: 'error',
          timestamp: new Date().toISOString(),
        };
      }
    })
    .get('/', () => ({
      name: 'FlapTalk API',
      version: '0.1.0',
    }));

export const app = createApp();

export type App = typeof app;
