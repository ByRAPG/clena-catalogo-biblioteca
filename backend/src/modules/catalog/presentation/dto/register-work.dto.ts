import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class RegisterWorkDto {
  @ApiProperty({ example: 'Cien años de soledad', maxLength: 300 })
  @IsString({ message: 'El título debe ser texto' })
  @MaxLength(300, { message: 'El título admite máximo 300 caracteres' })
  title!: string;

  @ApiProperty({
    type: [String],
    example: ['Gabriel García Márquez'],
    description:
      'Al menos uno. El primero es el autor principal. Si el autor ya existe se reutiliza.',
  })
  @IsArray({ message: 'Los autores deben ser una lista' })
  @ArrayMaxSize(20, { message: 'Máximo 20 autores' })
  @IsString({ each: true, message: 'Cada autor debe ser texto' })
  @MaxLength(200, {
    each: true,
    message: 'Cada autor admite máximo 200 caracteres',
  })
  authors!: string[];

  @ApiPropertyOptional({ type: [String], example: ['Realismo mágico'] })
  @IsOptional()
  @IsArray({ message: 'Los temas deben ser una lista' })
  @ArrayMaxSize(20, { message: 'Máximo 20 temas' })
  @IsString({ each: true, message: 'Cada tema debe ser texto' })
  @MaxLength(200, {
    each: true,
    message: 'Cada tema admite máximo 200 caracteres',
  })
  subjects?: string[];

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Id de GET /api/v1/search/categories',
  })
  @IsOptional()
  @IsUUID('all', { message: 'La categoría no es válida' })
  categoryId?: string;

  @ApiPropertyOptional({ example: 1967 })
  @IsOptional()
  @IsInt({ message: 'El año debe ser un número entero' })
  year?: number;
}

export class RegisteredWorkDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Cien años de soledad' })
  title!: string;
}
