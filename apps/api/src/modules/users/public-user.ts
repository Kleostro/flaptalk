import { t, type Static } from 'elysia';

import type { Prisma } from '@api/generated/prisma/client';

export const publicUserSelect = {
  createdAt: true,
  email: true,
  id: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export const PublicUserModel = t.Object({
  createdAt: t.String({
    format: 'date-time',
  }),
  email: t.String({
    format: 'email',
  }),
  id: t.Numeric(),
  updatedAt: t.String({
    format: 'date-time',
  }),
});

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
