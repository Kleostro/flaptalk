import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { Elysia } from 'elysia';
import { DomainError } from './errors/domain-error';
import { ErrorModel } from './models/error';
import { prismaPlugin } from './plugins/prisma';
import { usersModule } from './modules/users';

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
    .use(prismaPlugin)
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
    .onError(({ error, code, set }: any) => {
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
    .use(usersModule)
    .get('/', () => ({
      name: 'FlapTalk API',
      version: '0.1.0',
    }));

export const app = createApp();

export type App = typeof app;
