import { t, type Static } from 'elysia';

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

export const UsersModel = {
  'users.entity': PublicUserModel,
  'users.list.response': t.Array(PublicUserModel),
};
