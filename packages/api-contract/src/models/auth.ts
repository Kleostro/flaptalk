import { t } from 'elysia';

import { AUTH_FORM_LIMITS, DEFAULT_AUTH_COOKIE_NAME } from '@flaptalk/api-contract/constants/auth';
import { PublicUserModel } from '@flaptalk/api-contract/models/users';

export const RegisterRequestBodyModel = t.Object({
  email: t.String({
    format: 'email',
    maxLength: AUTH_FORM_LIMITS.emailMaxLength,
  }),
  password: t.String({
    maxLength: AUTH_FORM_LIMITS.passwordMaxLength,
    minLength: AUTH_FORM_LIMITS.passwordMinLength,
  }),
});

export const LoginRequestBodyModel = t.Object({
  email: t.String({
    format: 'email',
    maxLength: AUTH_FORM_LIMITS.emailMaxLength,
  }),
  password: t.String({
    maxLength: AUTH_FORM_LIMITS.passwordMaxLength,
    minLength: 1,
  }),
});

export const AuthenticatedUserModel = t.Object({
  user: PublicUserModel,
});

export const AuthLogoutResponseModel = t.Object({
  success: t.Literal(true),
});

export function createSessionCookieModel(cookieName = DEFAULT_AUTH_COOKIE_NAME) {
  return t.Cookie({
    [cookieName]: t.Optional(t.String()),
  });
}

export const AuthModel = {
  'auth.login.body': LoginRequestBodyModel,
  'auth.logout.response': AuthLogoutResponseModel,
  'auth.me.response': AuthenticatedUserModel,
  'auth.register.body': RegisterRequestBodyModel,
  'auth.session.response': AuthenticatedUserModel,
};
