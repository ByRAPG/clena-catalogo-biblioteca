import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { EDITABLE_COPY_STATUSES } from '../../domain/entities/copy-update';

export class UpdateCopyDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Estante de destino (GET /api/v1/catalog/shelves). Se puede cambiar aunque el ejemplar esté prestado.',
  })
  @IsOptional()
  @IsUUID('all', { message: 'El estante no es válido' })
  shelfId?: string;

  @ApiPropertyOptional({
    enum: EDITABLE_COPY_STATUSES,
    description:
      'PRESTADO no se pone a mano: lo maneja el módulo de préstamos. Al menos uno de los dos campos es obligatorio.',
  })
  @IsOptional()
  @IsIn([...EDITABLE_COPY_STATUSES], {
    message: 'El estado debe ser DISPONIBLE, MANTENIMIENTO o BAJA',
  })
  status?: string;
}

export class CopyResponseDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'CLENA-0001-1' }) inventoryCode!: string;
  @ApiProperty({ enum: ['DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO', 'BAJA'] })
  status!: string;
  @ApiProperty({ format: 'uuid' }) shelfId!: string;
  @ApiProperty({ example: 'A-03' }) shelf!: string;
  @ApiProperty({ example: 'Literatura Latinoamericana' }) section!: string;
  @ApiProperty({ example: 'Sala General' }) room!: string;
}

export class ShelfDto {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'A-03' }) code!: string;
  @ApiProperty({ example: 'Literatura Latinoamericana' }) section!: string;
  @ApiProperty({ example: 'Sala General' }) room!: string;
}

export class ShelfListDto {
  @ApiProperty({ type: [ShelfDto] }) data!: ShelfDto[];
}
