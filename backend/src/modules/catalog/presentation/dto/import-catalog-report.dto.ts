import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiProperty({ example: 1, description: 'Ejemplares creados' })
  created!: number;

  @ApiProperty({ example: 0, description: 'Ejemplares actualizados' })
  updated!: number;

  @ApiProperty({ example: 1, description: 'Filas rechazadas' })
  failed!: number;

  @ApiProperty({ type: [ImportRowResultDto] })
  rows!: ImportRowResultDto[];
}
