export const AUTH_ROUTE_TAG = 'Auth';

export const AUTH_FORM_LIMITS = {
  emailMaxLength: 320,
  passwordMaxLength: 72,
  passwordMinLength: 10,
} as const;

export const AUTH_ERROR_CODE = {
  emailAlreadyTaken: 'auth_email_already_taken',
  invalidCredentials: 'auth_invalid_credentials',
  unauthorized: 'auth_unauthorized',
} as const;

export const AUTH_TOKEN_TYPE = {
  session: 'session',
} as const;
