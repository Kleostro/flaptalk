import { DomainError } from '@api/errors/domain-error';
import { prisma } from '@api/db/prisma';
import { publicUserSelect, serializeUser } from '@api/modules/users/public-user';

import { AUTH_ERROR_CODE } from './constants';
import { passwordService, type PasswordService } from './password.service';
import type { LoginCredentials, RegisterCredentials } from './types';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class AuthService {
  private readonly passwordService: PasswordService;

  public constructor(passwordServiceInstance: PasswordService) {
    this.passwordService = passwordServiceInstance;
  }

  public async login(
    credentials: LoginCredentials,
  ): Promise<{ readonly user: ReturnType<typeof serializeUser> }> {
    const normalizedEmail = normalizeEmail(credentials.email);
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new DomainError(401, AUTH_ERROR_CODE.invalidCredentials, 'Invalid email or password.');
    }

    const isPasswordValid = await this.passwordService.verify(
      credentials.password,
      user.hashedPassword,
    );

    if (!isPasswordValid) {
      throw new DomainError(401, AUTH_ERROR_CODE.invalidCredentials, 'Invalid email or password.');
    }

    return {
      user: serializeUser(user),
    };
  }

  public async register(
    credentials: RegisterCredentials,
  ): Promise<{ readonly user: ReturnType<typeof serializeUser> }> {
    const normalizedEmail = normalizeEmail(credentials.email);
    const existingUser = await prisma.user.findUnique({
      select: { id: true },
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new DomainError(
        409,
        AUTH_ERROR_CODE.emailAlreadyTaken,
        'An account with this email already exists.',
      );
    }

    const hashedPassword = await this.passwordService.hash(credentials.password);
    const registeredUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        hashedPassword,
      },
      select: publicUserSelect,
    });

    return {
      user: serializeUser(registeredUser),
    };
  }
}

export const authService = new AuthService(passwordService);
