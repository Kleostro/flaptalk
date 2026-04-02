export class DomainError extends Error {
  constructor(
    readonly status: 401 | 403 | 404 | 409,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
