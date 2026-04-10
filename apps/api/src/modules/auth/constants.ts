import { AUTH_FORM_LIMITS, AUTH_TOKEN_TYPE } from '@flaptalk/api-contract/constants/auth';

export { AUTH_FORM_LIMITS, AUTH_TOKEN_TYPE };

export const AUTH_ROUTE_TAG = 'Auth';

export const AUTH_ERROR_CODE = {
  emailAlreadyTaken: 'auth_email_already_taken',
  invalidCredentials: 'auth_invalid_credentials',
  unauthorized: 'auth_unauthorized',
} as const;
