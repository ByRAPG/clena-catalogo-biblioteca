import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SuggestTermsQueryDto {
  @ApiPropertyOptional({
    example: 'garcia',
    description: 'Parte del nombre; con menos de 2 letras la lista sale vacía',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}

export class CatalogTermDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Gabriel García Márquez' })
  name!: string;
}

export class CatalogTermListDto {
  @ApiProperty({ type: [CatalogTermDto] })
  data!: CatalogTermDto[];
}
