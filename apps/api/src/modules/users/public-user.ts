import type { Static } from 'elysia';

import type { Prisma } from '@api/generated/prisma/client';
import { PublicUserModel } from '@flaptalk/api-contract';

export const publicUserSelect = {
  createdAt: true,
  email: true,
  id: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Static<typeof PublicUserModel>;

export function serializeUser(user: {
  readonly createdAt: Date;
  readonly email: string;
  readonly id: number;
  readonly updatedAt: Date;
}): PublicUser {
  return {
    createdAt: user.createdAt.toISOString(),
    email: user.email,
    id: user.id,
    updatedAt: user.updatedAt.toISOString(),
  };
}
