import { app } from './app';
import { prisma } from './db/prisma';
import { logger } from './observability/logger';

const port = Number(process.env.PORT ?? 3000);

await prisma.$connect();

app.listen(port);

logger.info('app.started', {
  hostname: app.server?.hostname,
  port: app.server?.port,
});
