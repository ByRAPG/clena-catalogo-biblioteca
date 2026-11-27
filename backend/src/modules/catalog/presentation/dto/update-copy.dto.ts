import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
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

export class RegisterCopyDto {
  @ApiProperty({ example: 'CLENA-0042-1', maxLength: 50 })
  @IsString({ message: 'El código de inventario debe ser texto' })
  @IsNotEmpty({ message: 'Escriba el código de inventario' })
  @MaxLength(50, {
    message: 'El código de inventario admite máximo 50 caracteres',
  })
  inventoryCode!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Estante (GET /api/v1/catalog/shelves): define sala y sección',
  })
  @IsUUID('all', { message: 'El estante no es válido' })
  shelfId!: string;

  @ApiPropertyOptional({
    enum: EDITABLE_COPY_STATUSES,
    default: 'DISPONIBLE',
  })
  @IsOptional()
  @IsIn([...EDITABLE_COPY_STATUSES], {
    message: 'El estado debe ser DISPONIBLE, MANTENIMIENTO o BAJA',
  })
  status?: string;
}
