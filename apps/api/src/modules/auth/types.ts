import type { Static } from 'elysia';

import type { PublicUserModel } from '@api/modules/users/public-user';

import { AUTH_TOKEN_TYPE } from './constants';

export interface RegisterCredentials {
  readonly email: string;
  readonly password: string;
}

export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
}

export interface AuthTokenPayload extends Record<string, string> {
  readonly email: string;
  readonly sub: string;
  readonly type: (typeof AUTH_TOKEN_TYPE)[keyof typeof AUTH_TOKEN_TYPE];
}

export interface AuthSession {
  readonly user: Static<typeof PublicUserModel>;
}
