import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBase64,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { CSV_IMPORT_LIMITS } from '../../domain/value-objects/csv-limits';

const MAX_BASE64_LENGTH = Math.ceil((CSV_IMPORT_LIMITS.maxBytes * 4) / 3) + 4;

export class ImportCatalogDto {
  @ApiProperty({ example: 'catalogo.csv', maxLength: 255 })
  @IsString()
  @Matches(/^[^/\\]+\.(csv|tsv|txt)$/i, {
    message: 'El archivo debe tener extensión .csv, .tsv o .txt',
  })
  @Matches(/^\P{Cc}+$/u)
  @MaxLength(255)
  fileName!: string;

  @ApiPropertyOptional({
    description:
      'Contenido CSV en texto UTF-8 (separado por coma, punto y coma o tabulador). Máximo 1 MB y 5 000 filas.',
    maxLength: CSV_IMPORT_LIMITS.maxBytes,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El contenido del archivo no puede estar vacío' })
  @MaxLength(CSV_IMPORT_LIMITS.maxBytes, {
    message: 'El archivo supera el tamaño máximo permitido de 1 MB',
  })
  content?: string;

  @ApiPropertyOptional({
    description:
      'Contenido binario del archivo en Base64 para detección automática de UTF-8 (con o sin BOM) y Windows-1252. Máximo 1 MB.',
    maxLength: MAX_BASE64_LENGTH,
  })
  @IsOptional()
  @IsString()
  @IsBase64({}, { message: 'El contenido en Base64 del archivo no es válido' })
  @MaxLength(MAX_BASE64_LENGTH, {
    message: 'El archivo supera el tamaño máximo permitido de 1 MB',
  })
  contentBase64?: string;
}
