import { t } from 'elysia';

import { PublicUserModel } from '@api/modules/users/public-user';

export const UsersPrismaModel = {
  'users.entity': PublicUserModel,
  'users.list.response': t.Array(PublicUserModel),
};
