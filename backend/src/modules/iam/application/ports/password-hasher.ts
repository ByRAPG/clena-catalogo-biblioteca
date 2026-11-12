export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface PasswordHasher {
  verify(plainPassword: string, passwordHash: string): Promise<boolean>;
}
