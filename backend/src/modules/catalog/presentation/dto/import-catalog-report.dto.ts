import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportEntitySummaryDto {
  @ApiProperty({ example: 1, description: 'Cantidad creada' })
  created!: number;

  @ApiProperty({ example: 0, description: 'Cantidad actualizada' })
  updated!: number;
}

export class ImportRowResultDto {
  @ApiProperty({ example: 2, description: 'Línea final del registro CSV' })
  row!: number;

  @ApiProperty({ enum: ['created', 'updated', 'failed'], example: 'created' })
  status!: 'created' | 'updated' | 'failed';

  @ApiPropertyOptional({ example: 'titulo' })
  field?: string;

  @ApiPropertyOptional({ example: 'El campo titulo es obligatorio' })
  error?: string;
}

export class ImportCatalogReportDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Identificador del registro de importación (solo en importación real)',
  })
  importId?: string;

  @ApiProperty({
    example: false,
    description:
      'Indica si el resultado corresponde a una simulación sin escritura',
  })
  dryRun!: boolean;

  @ApiProperty({ example: 1, description: 'Ejemplares creados' })
  created!: number;

  @ApiProperty({ example: 0, description: 'Ejemplares actualizados' })
  updated!: number;

  @ApiProperty({ example: 1, description: 'Filas rechazadas' })
  failed!: number;

  @ApiProperty({
    type: ImportEntitySummaryDto,
    description: 'Resumen de obras creadas y actualizadas',
  })
  works!: ImportEntitySummaryDto;

  @ApiProperty({
    type: ImportEntitySummaryDto,
    description: 'Resumen de ejemplares creados y actualizados',
  })
  copies!: ImportEntitySummaryDto;

  @ApiProperty({ type: [ImportRowResultDto] })
  rows!: ImportRowResultDto[];
}
