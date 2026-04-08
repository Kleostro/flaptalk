export const DEFAULT_AUTH_COOKIE_NAME = 'flaptalk_local_session';

export const AUTH_FORM_LIMITS = {
  emailMaxLength: 320,
  passwordMaxLength: 72,
  passwordMinLength: 10,
} as const;

export const AUTH_TOKEN_TYPE = {
  session: 'session',
} as const;
