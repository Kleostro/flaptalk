import Elysia from 'elysia';
import { UsersModel } from '@flaptalk/api-contract';

import { usersService } from './service';
import type { UsersService } from './service';

export const usersModule = new Elysia({
  name: 'flaptalk.contacts',
  prefix: '/users',
})
  .use(usersService)
  .model(UsersModel)
  .get('/', async ({ usersService }: { usersService: UsersService }) => usersService.list());
