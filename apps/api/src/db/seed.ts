import { prisma } from './prisma';
import { logger } from '../observability/logger';

async function main() {}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    logger.error('db.seed.failed', {
      error,
    });
    await prisma.$disconnect();
    process.exit(1);
  });
