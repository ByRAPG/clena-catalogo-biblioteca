import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SearchWorksQueryDto {
  @ApiPropertyOptional({
    description:
      'Texto a buscar en título, autor o tema. Tolera tildes, mayúsculas y errores de escritura.',
    maxLength: 100,
    example: 'cien años sole',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({
    description: 'Filtra por categoría (id de GET /search/categories)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filtra por sala (id de GET /search/rooms)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @ApiPropertyOptional({
    description: 'Con `true`, solo obras con algún ejemplar disponible',
    enum: ['true'],
  })
  @IsOptional()
  @IsIn(['true'])
  available?: 'true';

  @ApiPropertyOptional({ minimum: 1, default: 1, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 10, example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}
