export class PasswordService {
  public async hash(password: string): Promise<string> {
    return Bun.password.hash(password);
  }

  public async verify(password: string, hash: string): Promise<boolean> {
    return Bun.password.verify(password, hash);
  }
}

export const passwordService = new PasswordService();
