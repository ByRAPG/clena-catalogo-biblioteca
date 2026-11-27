import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExpireReservations } from '../application/reservations.use-cases';

/**
 * Marca como vencidas las reservas por intervalo. No tiene lógica de negocio y
 * nunca hace fallar el arranque: un error solo se registra. Con
 * RESERVATION_EXPIRY_INTERVAL_SECONDS=0 (o sin definir) no programa nada; de
 * todos modos las vencidas se marcan al reservar y al listar.
 */
@Injectable()
export class ReservationExpiryScheduler
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(ReservationExpiryScheduler.name);
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly expire: ExpireReservations,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    const seconds = Number(
      this.config.get('RESERVATION_EXPIRY_INTERVAL_SECONDS') ?? 0,
    );
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    this.timer = setInterval(() => void this.run(), seconds * 1000);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  async run(): Promise<void> {
    try {
      const count = await this.expire.execute();
      if (count > 0) this.logger.log(`Reservas vencidas: ${count}`);
    } catch (error) {
      this.logger.error(
        `Vencimiento de reservas falló: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
