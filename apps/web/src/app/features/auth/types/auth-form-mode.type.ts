export const AUTH_FORM_MODE = {
  login: 'login',
  registration: 'registration',
} as const;

export type AuthFormMode = (typeof AUTH_FORM_MODE)[keyof typeof AUTH_FORM_MODE];
