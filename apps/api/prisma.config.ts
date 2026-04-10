import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const directDatabaseUrl = process.env['DIRECT_DATABASE_URL']?.trim();
const databaseUrl = process.env['DATABASE_URL']?.trim();

if (!directDatabaseUrl && !databaseUrl) {
  throw new Error('DIRECT_DATABASE_URL or DATABASE_URL must be configured for Prisma.');
}

export default defineConfig({
  schema: 'prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun run src/db/seed.ts',
  },
  datasource: {
    url: directDatabaseUrl || databaseUrl!,
  },
});
