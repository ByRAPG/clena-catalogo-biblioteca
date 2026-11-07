import { Inject, Injectable } from '@nestjs/common';
import { HealthReport } from '../domain/health-report';
import { HEALTH_REPOSITORY, HealthRepository } from './ports/health.repository';

@Injectable()
export class GetHealth {
  constructor(
    @Inject(HEALTH_REPOSITORY) private readonly health: HealthRepository,
  ) {}

  async execute(): Promise<HealthReport> {
    const databaseUp = await this.safeCheck();
    return {
      status: databaseUp ? 'ok' : 'degraded',
      database: databaseUp ? 'up' : 'down',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  private async safeCheck(): Promise<boolean> {
    try {
      return await this.health.isDatabaseAvailable();
    } catch {
      return false;
    }
  }
}
