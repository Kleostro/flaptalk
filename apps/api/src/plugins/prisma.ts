import { Elysia } from 'elysia';

import { prisma } from '../db/prisma';

export const prismaPlugin = new Elysia({
  name: 'flaptalk.prisma',
})
  .decorate('prisma', prisma)
  .onStop(async () => {
    await prisma.$disconnect();
  });
