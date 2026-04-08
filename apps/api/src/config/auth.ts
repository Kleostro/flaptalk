const DEFAULT_AUTH_COOKIE_NAME = 'flaptalk_session';
const DEFAULT_AUTH_SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const DEVELOPMENT_AUTH_SECRET = 'flaptalk-development-auth-secret-change-me';

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

function resolveAuthSecret(): string {
  const configuredSecret = process.env['AUTH_JWT_SECRET']?.trim();

  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env['NODE_ENV'] === 'production') {
    throw new Error('AUTH_JWT_SECRET must be configured in production.');
  }

  return DEVELOPMENT_AUTH_SECRET;
}

export const authConfig = Object.freeze({
  cookieName: process.env['AUTH_COOKIE_NAME']?.trim() || DEFAULT_AUTH_COOKIE_NAME,
  cookiePath: '/',
  isSecureCookie: process.env['NODE_ENV'] === 'production',
  issuer: 'flaptalk-api',
  jwtDecoratorName: 'authJwt',
  jwtSecret: resolveAuthSecret(),
  sessionTtlSeconds: parsePositiveInteger(
    process.env['AUTH_SESSION_TTL_SECONDS'],
    DEFAULT_AUTH_SESSION_TTL_SECONDS,
  ),
});
