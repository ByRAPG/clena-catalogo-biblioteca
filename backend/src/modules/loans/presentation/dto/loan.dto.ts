import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DEFAULT_LOAN_DAYS,
  MAX_LOAN_DAYS,
  MIN_LOAN_DAYS,
} from '../../domain/entities/loan.entity';
import type {
  LoanCopySummary,
  LoanReaderSummary,
  LoanRecord,
  LoanStatusFilter,
} from '../../domain/repositories/loan.repository';

export class RegisterLoanDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Identificador del ejemplar (opcional si se envía inventoryCode)',
  })
  @IsOptional()
  @IsUUID('all', { message: 'copyId debe ser un UUID válido' })
  copyId?: string;

  @ApiPropertyOptional({
    example: 'CLENA-0001-1',
    description:
      'Código de inventario del ejemplar (opcional si se envía copyId)',
  })
  @IsOptional()
  @IsString()
  inventoryCode?: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Identificador del lector',
  })
  @IsUUID('all', { message: 'readerId debe ser un UUID válido' })
  readerId!: string;

  @ApiPropertyOptional({
    default: DEFAULT_LOAN_DAYS,
    minimum: MIN_LOAN_DAYS,
    maximum: MAX_LOAN_DAYS,
    description: 'Plazo del préstamo en días calendario',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'loanDays debe ser un número entero' })
  @Min(MIN_LOAN_DAYS)
  @Max(MAX_LOAN_DAYS)
  loanDays?: number;
}

export class ListLoansQueryDto {
  @ApiPropertyOptional({
    enum: ['active', 'returned', 'all'],
    default: 'active',
  })
  @IsOptional()
  @IsIn(['active', 'returned', 'all'])
  status?: LoanStatusFilter;

  @ApiPropertyOptional({
    description: 'Buscar por código de inventario, título de la obra o lector',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: 'La búsqueda no puede superar los 100 caracteres',
  })
  q?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;
}

export class SearchCounterQueryDto {
  @ApiPropertyOptional({ description: 'Texto de búsqueda' })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: 'La búsqueda no puede superar los 100 caracteres',
  })
  q?: string;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class RegisterReaderDto {
  @ApiProperty({ example: 'Carmen Pérez' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo del lector es obligatorio' })
  @MaxLength(150, { message: 'El nombre no puede superar los 150 caracteres' })
  fullName!: string;

  @ApiPropertyOptional({ example: '1045123456' })
  @IsOptional()
  @IsString()
  @MaxLength(40, { message: 'El documento no puede superar los 40 caracteres' })
  documentId?: string;

  @ApiPropertyOptional({ example: 'carmen@example.org' })
  @IsOptional()
  @IsString()
  @MaxLength(254, { message: 'El correo no puede superar los 254 caracteres' })
  email?: string;

  @ApiPropertyOptional({ example: '3001234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30, { message: 'El teléfono no puede superar los 30 caracteres' })
  phone?: string;
}

export class LoanCopyInfoDto {
  @ApiProperty() id!: string;
  @ApiProperty() inventoryCode!: string;
  @ApiProperty() status!: string;
  @ApiProperty() workId!: string;
  @ApiProperty() workTitle!: string;
  @ApiProperty() room!: string;
  @ApiProperty() section!: string;
  @ApiProperty() shelf!: string;
}

export class LoanReaderInfoDto {
  @ApiProperty() id!: string;
  @ApiProperty() fullName!: string;
  @ApiPropertyOptional({ nullable: true }) documentId!: string | null;
  @ApiPropertyOptional({ nullable: true }) email!: string | null;
}

export class LoanStaffInfoDto {
  @ApiProperty() id!: string;
  @ApiProperty() fullName!: string;
}

export class LoanResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() loanedAt!: string;
  @ApiProperty() dueAt!: string;
  @ApiPropertyOptional({ nullable: true }) returnedAt!: string | null;
  @ApiProperty() active!: boolean;
  @ApiProperty() overdue!: boolean;
  @ApiProperty({ type: LoanCopyInfoDto }) copy!: LoanCopyInfoDto;
  @ApiProperty({ type: LoanReaderInfoDto }) reader!: LoanReaderInfoDto;
  @ApiPropertyOptional({ type: LoanStaffInfoDto, nullable: true })
  staff!: LoanStaffInfoDto | null;
}

export class PaginatedLoansResponseDto {
  @ApiProperty({ type: [LoanResponseDto] }) data!: LoanResponseDto[];
  @ApiProperty() total!: number;
  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
}

export class LoanReaderSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() fullName!: string;
  @ApiPropertyOptional({ nullable: true }) documentId!: string | null;
  @ApiPropertyOptional({ nullable: true }) email!: string | null;
  @ApiPropertyOptional({ nullable: true }) phone!: string | null;
}

export class LoanReaderListDto {
  @ApiProperty({ type: [LoanReaderSummaryDto] })
  data!: LoanReaderSummaryDto[];
}

export class LoanCopySearchItemDto extends LoanCopyInfoDto {
  @ApiProperty() hasActiveReservation!: boolean;
}

export class LoanCopyListDto {
  @ApiProperty({ type: [LoanCopySearchItemDto] })
  data!: LoanCopySearchItemDto[];
}

export function toLoanResponseDto(
  record: LoanRecord,
  now: Date,
): LoanResponseDto {
  return {
    id: record.loan.id,
    loanedAt: record.loan.loanedAt.toISOString(),
    dueAt: record.loan.dueAt.toISOString(),
    returnedAt: record.loan.returnedAt
      ? record.loan.returnedAt.toISOString()
      : null,
    active: record.loan.isActive(),
    overdue: record.loan.isOverdueAt(now),
    copy: { ...record.copy },
    reader: { ...record.reader },
    staff: record.staff ? { ...record.staff } : null,
  };
}

export function toReaderSummaryDto(
  reader: LoanReaderSummary,
): LoanReaderSummaryDto {
  return {
    id: reader.id,
    fullName: reader.fullName,
    documentId: reader.documentId,
    email: reader.email,
    phone: reader.phone,
  };
}

export function toCopySearchItemDto(
  copy: LoanCopySummary,
): LoanCopySearchItemDto {
  return {
    id: copy.id,
    inventoryCode: copy.inventoryCode,
    status: copy.status,
    workId: copy.workId,
    workTitle: copy.workTitle,
    room: copy.room,
    section: copy.section,
    shelf: copy.shelf,
    hasActiveReservation: copy.hasActiveReservation,
  };
}
