import { Injectable } from '@nestjs/common';
import type { User as UserRow } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import { UserRepository } from '../application/ports/user.repository';
import { Email } from '../domain/email.vo';
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
}
