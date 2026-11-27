import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import type { ReservationRecord } from '../domain/reservation.repository';

export class CreateReservationDto {
  @ApiProperty({ description: 'Obra que se quiere reservar' })
  @IsUUID(undefined, { message: 'Indique una obra válida' })
  workId!: string;
}

export class ReservationResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() workId!: string;
  @ApiProperty() workTitle!: string;
  @ApiProperty() inventoryCode!: string;
  @ApiProperty() reservedAt!: string;
  @ApiProperty({ description: 'Plazo para recoger el libro' })
  expiresAt!: string;
}

export class ReservationListResponseDto {
  @ApiProperty({ type: [ReservationResponseDto] })
  data!: ReservationResponseDto[];
}

export function toReservationResponse(
  record: ReservationRecord,
): ReservationResponseDto {
  return {
    id: record.id,
    workId: record.workId,
    workTitle: record.workTitle,
    inventoryCode: record.inventoryCode,
    reservedAt: record.reservedAt.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
  };
}
