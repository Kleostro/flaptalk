import { app } from './app';
import { prisma } from './db/prisma';

const port = Number(process.env.PORT ?? 3000);

await prisma.$connect();

app.listen(port);

console.log(`Flaptalk API is running at ${app.server?.hostname}:${app.server?.port}`);
