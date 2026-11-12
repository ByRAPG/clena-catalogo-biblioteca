import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class ImportCatalogDto {
  @ApiProperty({ example: 'catalogo.csv', maxLength: 255 })
  @IsString()
  @Matches(/^[^/\\]+\.csv$/i)
  @Matches(/^\P{Cc}+$/u)
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({
    description: 'Contenido CSV UTF-8 con las cabeceras de la plantilla',
    maxLength: 1000000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000000)
  content!: string;
}
