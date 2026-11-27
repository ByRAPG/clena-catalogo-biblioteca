import { Inject, Injectable } from '@nestjs/common';
import { ReservationNotFoundError } from '../domain/reservation.errors';
import {
  RESERVATION_CLOCK,
  RESERVATION_HOURS,
  RESERVATION_REPOSITORY,
  type ReservationClock,
  type ReservationRecord,
  type ReservationRepository,
} from '../domain/reservation.repository';

const MS_PER_HOUR = 60 * 60 * 1000;

/** HU-14: un lector reserva un ejemplar disponible de una obra. */
@Injectable()
export class ReserveWork {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    @Inject(RESERVATION_CLOCK) private readonly clock: ReservationClock,
    @Inject(RESERVATION_HOURS) private readonly hours: number,
  ) {}

  async execute(input: {
    userId: string;
    workId: string;
  }): Promise<ReservationRecord> {
    const now = this.clock.now();
    // Libera los ejemplares cuyas reservas ya vencieron antes de buscar uno.
    await this.reservations.expireDue(now);
    const readerId = await this.reservations.ensureReaderForUser(input.userId);
    return this.reservations.reserveAvailableCopy({
      workId: input.workId,
      readerId,
      reservedAt: now,
      expiresAt: new Date(now.getTime() + this.hours * MS_PER_HOUR),
    });
  }
}

/** Reservas activas del lector; marca antes las vencidas. */
@Injectable()
export class ListMyReservations {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    @Inject(RESERVATION_CLOCK) private readonly clock: ReservationClock,
  ) {}

  async execute(userId: string): Promise<ReservationRecord[]> {
    await this.reservations.expireDue(this.clock.now());
    const readerId = await this.reservations.ensureReaderForUser(userId);
    return this.reservations.listActiveByReader(readerId);
  }
}

/** El lector cancela una de sus reservas activas. */
@Injectable()
export class CancelReservation {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    @Inject(RESERVATION_CLOCK) private readonly clock: ReservationClock,
  ) {}

  async execute(input: {
    userId: string;
    reservationId: string;
  }): Promise<void> {
    const readerId = await this.reservations.ensureReaderForUser(input.userId);
    const cancelled = await this.reservations.cancel({
      reservationId: input.reservationId,
      readerId,
      now: this.clock.now(),
    });
    // Una reserva ajena responde igual que una inexistente.
    if (!cancelled) throw new ReservationNotFoundError();
  }
}

/** Marca como VENCIDAS las reservas cuyo plazo se cumplió. */
@Injectable()
export class ExpireReservations {
  constructor(
    @Inject(RESERVATION_REPOSITORY)
    private readonly reservations: ReservationRepository,
    @Inject(RESERVATION_CLOCK) private readonly clock: ReservationClock,
  ) {}

  execute(): Promise<number> {
    return this.reservations.expireDue(this.clock.now());
  }
}
