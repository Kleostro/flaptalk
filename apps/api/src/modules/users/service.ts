import { prisma } from '@api/db/prisma';
import Elysia from 'elysia';

export class UsersService {
  async list() {
    return prisma.user.findMany();
  }
}

export const usersService = new Elysia({
  name: 'flaptalk.users.service',
}).decorate('usersService', new UsersService());
