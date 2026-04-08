import { t } from 'elysia';

import { authConfig } from '@api/config/auth';
import { PublicUserModel } from '@api/modules/users/public-user';

import { AUTH_FORM_LIMITS } from './constants';

export const registerRequestBodyModel = t.Object({
  email: t.String({
    format: 'email',
    maxLength: AUTH_FORM_LIMITS.emailMaxLength,
  }),
  password: t.String({
    maxLength: AUTH_FORM_LIMITS.passwordMaxLength,
    minLength: AUTH_FORM_LIMITS.passwordMinLength,
  }),
});

export const loginRequestBodyModel = t.Object({
  email: t.String({
    format: 'email',
    maxLength: AUTH_FORM_LIMITS.emailMaxLength,
  }),
  password: t.String({
    maxLength: AUTH_FORM_LIMITS.passwordMaxLength,
    minLength: 1,
  }),
});

export const sessionCookieModel = t.Cookie({
  [authConfig.cookieName]: t.Optional(t.String()),
});

export const AuthenticatedUserModel = t.Object({
  user: PublicUserModel,
});

export const authLogoutResponseModel = t.Object({
  success: t.Literal(true),
});

export const AuthModel = {
  'auth.cookie': sessionCookieModel,
  'auth.login.body': loginRequestBodyModel,
  'auth.me.response': AuthenticatedUserModel,
  'auth.logout.response': authLogoutResponseModel,
  'auth.register.body': registerRequestBodyModel,
  'auth.session.response': AuthenticatedUserModel,
  'users.public': PublicUserModel,
};
