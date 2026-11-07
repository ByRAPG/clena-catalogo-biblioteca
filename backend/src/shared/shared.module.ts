import { Global, Module } from '@nestjs/common';
import { GetHealth } from './application/get-health.use-case';
import { HEALTH_REPOSITORY } from './application/ports/health.repository';
import { PrismaHealthRepository } from './infrastructure/prisma-health.repository';
import { PrismaService } from './infrastructure/prisma.service';
import { HealthController } from './presentation/health.controller';

@Global()
@Module({
  controllers: [HealthController],
  providers: [
    PrismaService,
    GetHealth,
    { provide: HEALTH_REPOSITORY, useClass: PrismaHealthRepository },
  ],
  exports: [PrismaService],
})
export class SharedModule {}
