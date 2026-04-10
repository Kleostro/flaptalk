import { APP_ROUTE_PATHS } from '@web/app/core/constants/app-routes.constants';
import { AUTH_FORM_MODE } from '@web/app/features/auth/types/auth-form-mode.type';

export const AUTH_FORM_LIMITS = {
  passwordMaxLength: 64,
  passwordMinLength: 10,
} as const;

export const AUTH_FIELD_AUTOCOMPLETE = {
  confirmPassword: 'new-password',
  currentPassword: 'current-password',
  email: 'email',
  newPassword: 'new-password',
} as const;

export type AuthFieldAutocomplete = typeof AUTH_FIELD_AUTOCOMPLETE;

export const AUTH_FIELD_IDS = {
  loginEmail: 'login-email',
  loginPassword: 'login-password',
  registrationConfirmPassword: 'registration-confirm-password',
  registrationEmail: 'registration-email',
  registrationPassword: 'registration-password',
} as const;

export const AUTH_FIELD_LABELS = {
  confirmPassword: 'Confirm password',
  email: 'Work email',
  password: 'Password',
} as const;

export type AuthFieldLabels = typeof AUTH_FIELD_LABELS;

export const AUTH_FIELD_PLACEHOLDERS = {
  confirmPassword: 'Repeat your password',
  email: 'alex@flaptalk.app',
  password: 'Create a durable password',
} as const;

export type AuthFieldPlaceholders = typeof AUTH_FIELD_PLACEHOLDERS;

export const AUTH_PASSWORD_REQUIREMENTS = [
  'Use at least ten characters.',
  'Mix upper and lower case letters.',
  'Add a number or symbol for extra strength.',
] as const;

export const AUTH_LOGIN_FORM_CONTENT = {
  description: 'Use your work email to restore workspace access and return to the product shell.',
  eyebrow: 'Workspace sign-in',
  highlights: [
    'Workspace access secured',
    'Session context restored',
    'Ready for rooms and threads',
  ],
} as const;

export const AUTH_REGISTRATION_FORM_CONTENT = {
  description:
    'Create workspace access now, then continue into the shell where setup, rooms, and summaries will follow.',
  eyebrow: 'Workspace account',
} as const;

export const AUTH_PAGE_CONTENT = {
  login: {
    alternateActionLabel: 'Create account',
    alternateActionRoute: `/${APP_ROUTE_PATHS.register}`,
    alternateActionText: 'New to Flaptalk?',
    description: 'Enter the workspace shell and restore the session tied to your account.',
    eyebrow: 'Welcome back',
    mode: AUTH_FORM_MODE.login,
    pendingSubmitLabel: 'Checking access...',
    submitLabel: 'Log in',
    title: 'Access the workspace shell.',
  },
  registration: {
    alternateActionLabel: 'Sign in',
    alternateActionRoute: `/${APP_ROUTE_PATHS.login}`,
    alternateActionText: 'Already have an account?',
    description:
      'Create account access first, then continue into the workspace shell and setup flow.',
    eyebrow: 'Create account',
    mode: AUTH_FORM_MODE.registration,
    pendingSubmitLabel: 'Creating workspace access...',
    submitLabel: 'Create account',
    title: 'Create workspace access.',
  },
} as const;
