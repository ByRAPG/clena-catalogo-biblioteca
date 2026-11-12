import { Injectable } from '@nestjs/common';
import { verify } from 'argon2';
import { PasswordHasher } from '../application/ports/password-hasher';

/** Mismo algoritmo que prisma/seed.ts: `hash()` de argon2 (argon2id por defecto). */
@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    try {
      return await verify(passwordHash, plainPassword);
    } catch {
      // Un hash ilegible en la base se trata como contraseña incorrecta.
      return false;
    }
  }
}
