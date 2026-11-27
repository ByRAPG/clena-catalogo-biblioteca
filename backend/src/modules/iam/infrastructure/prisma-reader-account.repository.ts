import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';
import {
  AccountProfile,
  AnonymizeResult,
  NewReaderAccount,
  ReaderAccountRepository,
} from '../application/ports/reader-account.repository';
import { EmailAlreadyRegisteredError } from '../domain/iam-errors';

const ANONYMIZED_NAME = 'Cuenta eliminada';

@Injectable()
export class PrismaReaderAccountRepository implements ReaderAccountRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createReaderAccount({
    user,
    privacyVersion,
    consentAt,
  }: NewReaderAccount): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            id: user.id,
            email: user.email.value,
            passwordHash: user.passwordHash,
            fullName: user.fullName,
            role: 'READER',
            active: true,
            privacyVersion,
            consentAt,
          },
        });
        // documentId es opcional: el lector con cuenta no lo necesita.
        await tx.reader.create({
          data: {
            userId: user.id,
            fullName: user.fullName,
            email: user.email.value,
            privacyVersion,
            consentAt,
          },
        });
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

  async getProfile(userId: string): Promise<AccountProfile | null> {
    return this.prisma.user.findFirst({
      where: { id: userId, active: true, anonymizedAt: null },
      select: {
        fullName: true,
        email: true,
        consentAt: true,
        privacyVersion: true,
      },
    });
  }

  async anonymize(input: {
    userId: string;
    anonymizedEmail: string;
    now: Date;
  }): Promise<AnonymizeResult> {
    const { userId, anonymizedEmail, now } = input;
    return this.prisma.$transaction(async (tx) => {
      const activeLoans = await tx.loan.count({
        where: { returnedAt: null, reader: { userId } },
      });
      if (activeLoans > 0) return 'has-active-loans';

      await tx.reservation.updateMany({
        where: { status: 'ACTIVA', reader: { userId } },
        data: { status: 'CANCELADA', resolvedAt: now },
      });
      await tx.reader.updateMany({
        where: { userId },
        data: {
          fullName: ANONYMIZED_NAME,
          documentId: null,
          email: null,
          phone: null,
          consentAt: null,
          anonymizedAt: now,
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          email: anonymizedEmail,
          fullName: ANONYMIZED_NAME,
          // Hash inutilizable: ninguna contraseña puede coincidir con él.
          passwordHash: '!anonimizada',
          active: false,
          anonymizedAt: now,
          consentAt: null,
        },
      });
      await tx.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });
      return 'done';
    });
  }
}
