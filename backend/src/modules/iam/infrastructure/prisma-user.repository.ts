import { Injectable } from '@nestjs/common';
import { Prisma, type User as UserRow } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import {
  UserRepository,
  UserSummary,
} from '../application/ports/user.repository';
import { Email } from '../domain/email.vo';
import { EmailAlreadyRegisteredError } from '../domain/iam-errors';
import { User } from '../domain/user.entity';

/** Convierte la fila de Prisma en entidad de dominio; el modelo no sale de esta capa. */
function toDomain(row: UserRow): User | null {
  // Una cuenta anonimizada (HU-17) ya no tiene un correo real: se trata como inexistente.
  if (row.anonymizedAt !== null) return null;
  return new User({
    id: row.id,
    email: Email.create(row.email),
    passwordHash: row.passwordHash,
    fullName: row.fullName,
    role: row.role,
    active: row.active,
    failedLogins: row.failedLogins,
    lockedUntil: row.lockedUntil,
    anonymizedAt: row.anonymizedAt,
  });
}

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.value },
    });
    return row ? toDomain(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async save(user: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLogins: user.failedLogins, lockedUntil: user.lockedUntil },
    });
  }

  async incrementFailedLogins(userId: string): Promise<number> {
    // `increment` se traduce a `SET failed_logins = failed_logins + 1`: la suma
    // la hace PostgreSQL, no la aplicación, y el valor devuelto es el resultante.
    const row = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLogins: { increment: 1 } },
      select: { failedLogins: true },
    });
    return row.failedLogins;
  }

  async lockAccount(userId: string, until: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lockedUntil: until, failedLogins: 0 },
    });
  }

  async create(user: User): Promise<void> {
    try {
      await this.prisma.user.create({
        data: {
          id: user.id,
          email: user.email.value,
          passwordHash: user.passwordHash,
          fullName: user.fullName,
          role: user.role,
          active: user.canLogin(),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new EmailAlreadyRegisteredError();
      }
      throw error;
    }
  }

  async listStaff(): Promise<UserSummary[]> {
    return this.prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'STAFF'] }, anonymizedAt: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    });
  }

  async setActive(userId: string, active: boolean): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { active } });
  }

  async existsActiveAdmin(): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { role: 'ADMIN', active: true, anonymizedAt: null },
    });
    return count > 0;
  }
}
