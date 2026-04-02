import { createApp } from './app';
import { prisma } from './db/prisma';

const port = Number(process.env.PORT ?? 3000);

await prisma.$connect();

const app = createApp().listen(port);
export type App = typeof app;

console.log(`Flaptalk API is running at ${app.server?.hostname}:${app.server?.port}`);
