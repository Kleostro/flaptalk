import { prisma } from '@api/db/prisma';
import { publicUserSelect, serializeUser } from '@api/modules/users/public-user';
import Elysia from 'elysia';

export class UsersService {
  public async list() {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: publicUserSelect,
    });

    return users.map((user) => serializeUser(user));
  }
}

export const usersService = new Elysia({
  name: 'flaptalk.users.service',
}).decorate('usersService', new UsersService());
