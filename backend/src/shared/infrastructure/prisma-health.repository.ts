import { Injectable } from '@nestjs/common';
import { HealthRepository } from '../application/ports/health.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaHealthRepository implements HealthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async isDatabaseAvailable(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
