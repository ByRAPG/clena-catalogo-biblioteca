import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IamModule } from '../iam/iam.module';
import {
  CancelReservation,
  ExpireReservations,
  ListMyReservations,
  ReserveWork,
} from './application/reservations.use-cases';
import {
  RESERVATION_CLOCK,
  RESERVATION_HOURS,
  RESERVATION_REPOSITORY,
} from './domain/reservation.repository';
import { PrismaReservationRepository } from './infrastructure/prisma-reservation.repository';
import { ReservationExpiryScheduler } from './infrastructure/reservation-expiry.scheduler';
import { ReservationsController } from './presentation/reservations.controller';

const DEFAULT_RESERVATION_HOURS = 48;

@Module({
  imports: [IamModule],
  controllers: [ReservationsController],
  providers: [
    ReserveWork,
    ListMyReservations,
    CancelReservation,
    ExpireReservations,
    ReservationExpiryScheduler,
    { provide: RESERVATION_REPOSITORY, useClass: PrismaReservationRepository },
    { provide: RESERVATION_CLOCK, useValue: { now: () => new Date() } },
    {
      provide: RESERVATION_HOURS,
      inject: [ConfigService],
      useFactory: (config: ConfigService): number =>
        Number(config.get('RESERVATION_HOURS') ?? DEFAULT_RESERVATION_HOURS),
    },
  ],
})
export class ReservationsModule {}
