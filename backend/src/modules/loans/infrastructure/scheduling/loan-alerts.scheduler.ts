import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RunLoanAlertsUseCase } from '../../application/use-cases/run-loan-alerts.use-case';

/**
 * Corre la revisión de avisos (HU-21) al arrancar y cada
 * LOAN_ALERTS_INTERVAL_SECONDS (por defecto una vez al día). No tiene lógica:
 * que no se repitan avisos lo garantiza el caso de uso. En pruebas
 * (NODE_ENV=test) o con el intervalo en 0 no programa nada.
 */
@Injectable()
export class LoanAlertsScheduler
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(LoanAlertsScheduler.name);
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly runAlerts: RunLoanAlertsUseCase,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    if (this.config.get<string>('NODE_ENV') === 'test') return;
    const seconds = Number(
      this.config.get('LOAN_ALERTS_INTERVAL_SECONDS') ?? 86_400,
    );
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    void this.run('arranque');
    this.timer = setInterval(() => void this.run('intervalo'), seconds * 1000);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  private async run(origin: string): Promise<void> {
    try {
      const summary = await this.runAlerts.execute();
      this.logger.log(
        `Revisión de avisos (${origin}): ${JSON.stringify(summary)}`,
      );
    } catch (error) {
      this.logger.error(
        `Revisión de avisos (${origin}) falló: ${String(error)}`,
      );
    }
  }
}
