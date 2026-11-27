import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import type { LoanAlertsPanel } from '../../application/use-cases/list-loan-alerts.use-case';
import type { PendingAvailabilityAlert } from '../../application/ports/loan-alerts.repository';

export class RequestAvailabilityAlertDto {
  @ApiProperty({ format: 'uuid', description: 'Lector con correo registrado' })
  @IsUUID('all', { message: 'El lector no es válido' })
  readerId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Libro sin ejemplares disponibles',
  })
  @IsUUID('all', { message: 'El libro no es válido' })
  workId!: string;
}

export class LoanAlertDto {
  @ApiProperty({ format: 'uuid' }) loanId!: string;
  @ApiProperty({ enum: ['VENCIDO', 'POR_VENCER'] }) type!: string;
  @ApiProperty({ format: 'date-time' }) dueAt!: string;
  @ApiProperty() inventoryCode!: string;
  @ApiProperty() workTitle!: string;
  @ApiProperty() readerName!: string;
  @ApiProperty({ nullable: true, type: String }) readerEmail!: string | null;
  @ApiProperty({
    nullable: true,
    type: String,
    format: 'date-time',
    description: 'Cuándo se envió el correo; null si no se ha enviado',
  })
  notifiedAt!: string | null;
  @ApiProperty({ nullable: true, type: String }) notifyError!: string | null;
}

export class AvailabilityAlertDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'uuid' }) workId!: string;
  @ApiProperty() workTitle!: string;
  @ApiProperty() readerName!: string;
  @ApiProperty({ nullable: true, type: String }) readerEmail!: string | null;
}

export class LoanAlertsPanelDto {
  @ApiProperty({
    type: [LoanAlertDto],
    description:
      'Préstamos vencidos primero y luego los que vencen en menos de 48 h',
  })
  loans!: LoanAlertDto[];

  @ApiProperty({ type: [AvailabilityAlertDto] })
  availability!: AvailabilityAlertDto[];
}

class DeliveryDto {
  @ApiProperty() sent!: number;
  @ApiProperty() failed!: number;
}

class ReminderDeliveryDto extends DeliveryDto {
  @ApiProperty() withoutEmail!: number;
  @ApiProperty({ description: 'Avisos que ya se habían creado antes' })
  alreadySent!: number;
}

export class LoanAlertsRunDto {
  @ApiProperty({ type: ReminderDeliveryDto }) reminders!: ReminderDeliveryDto;
  @ApiProperty({ type: DeliveryDto }) availability!: DeliveryDto;
}

export function toAvailabilityAlertDto(
  alert: PendingAvailabilityAlert,
): AvailabilityAlertDto {
  return {
    id: alert.id,
    createdAt: alert.createdAt.toISOString(),
    workId: alert.workId,
    workTitle: alert.workTitle,
    readerName: alert.reader.fullName,
    readerEmail: alert.reader.email,
  };
}

export function toLoanAlertsPanelDto(
  panel: LoanAlertsPanel,
): LoanAlertsPanelDto {
  return {
    loans: panel.loans.map((a) => ({
      loanId: a.loanId,
      type: a.type,
      dueAt: a.dueAt.toISOString(),
      inventoryCode: a.inventoryCode,
      workTitle: a.workTitle,
      readerName: a.readerName,
      readerEmail: a.readerEmail,
      notifiedAt: a.notifiedAt?.toISOString() ?? null,
      notifyError: a.notifyError,
    })),
    availability: panel.availability.map(toAvailabilityAlertDto),
  };
}
