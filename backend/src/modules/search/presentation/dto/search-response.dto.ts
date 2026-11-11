import { ApiProperty } from '@nestjs/swagger';

export class CategoryRefDto {
  @ApiProperty({
    format: 'uuid',
    example: '5b0f7d4e-1c1e-5a53-a3f1-0d7f4a2c9e11',
  })
  id!: string;

  @ApiProperty({ example: 'Literatura' })
  name!: string;
}

export class LocationDto {
  @ApiProperty({ example: 'Sala General' })
  room!: string;

  @ApiProperty({ example: 'Literatura Latinoamericana' })
  section!: string;

  @ApiProperty({ example: 'A-03' })
  shelf!: string;
}

export class AvailabilityDto {
  @ApiProperty({ enum: ['DISPONIBLE', 'NO_DISPONIBLE'], example: 'DISPONIBLE' })
  status!: 'DISPONIBLE' | 'NO_DISPONIBLE';

  @ApiProperty({
    enum: ['PRESTADO', 'MANTENIMIENTO', 'SIN_EJEMPLARES'],
    nullable: true,
    description: 'Motivo cuando no está disponible; null si lo está.',
    example: null,
  })
  reason!: 'PRESTADO' | 'MANTENIMIENTO' | 'SIN_EJEMPLARES' | null;

  @ApiProperty({ example: 2 })
  availableCopies!: number;

  @ApiProperty({
    example: 3,
    description: 'Ejemplares sin contar los dados de baja',
  })
  totalCopies!: number;

  @ApiProperty({ example: false, description: 'La obra tiene versión digital' })
  hasDigital!: boolean;
}

export class WorkSummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Cien años de soledad' })
  title!: string;

  @ApiProperty({ type: [String], example: ['Gabriel García Márquez'] })
  authors!: string[];

  @ApiProperty({ type: [String], example: ['Realismo mágico'] })
  subjects!: string[];

  @ApiProperty({ type: CategoryRefDto, nullable: true })
  category!: CategoryRefDto | null;

  @ApiProperty({ nullable: true, example: 1967 })
  year!: number | null;

  @ApiProperty({
    enum: ['title', 'author', 'subject'],
    nullable: true,
    description: 'Dónde coincidió el término; null si no hubo `q`.',
    example: 'title',
  })
  matchedOn!: 'title' | 'author' | 'subject' | null;

  @ApiProperty({ type: AvailabilityDto })
  availability!: AvailabilityDto;

  @ApiProperty({
    type: LocationDto,
    nullable: true,
    description:
      'Ubicación del primer ejemplar disponible o, si no hay, del primero no dado de baja.',
  })
  location!: LocationDto | null;
}

export class PageMetaDto {
  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  pageSize!: number;

  @ApiProperty({ example: 42, description: 'Total de resultados' })
  total!: number;
}

export class SearchWorksResponseDto {
  @ApiProperty({ type: [WorkSummaryDto] })
  data!: WorkSummaryDto[];

  @ApiProperty({ type: PageMetaDto })
  meta!: PageMetaDto;
}

export class WorkCopyDto {
  @ApiProperty({ example: 'CLENA-0001-1' })
  inventoryCode!: string;

  @ApiProperty({ enum: ['DISPONIBLE', 'PRESTADO', 'MANTENIMIENTO'] })
  status!: 'DISPONIBLE' | 'PRESTADO' | 'MANTENIMIENTO';

  @ApiProperty({ example: 'Sala General' })
  room!: string;

  @ApiProperty({ example: 'Literatura Latinoamericana' })
  section!: string;

  @ApiProperty({ example: 'A-03' })
  shelf!: string;
}

export class WorkDetailDto extends WorkSummaryDto {
  @ApiProperty({ nullable: true, example: null })
  subtitle!: string | null;

  @ApiProperty({ nullable: true, example: 'Editorial Sudamericana' })
  publisher!: string | null;

  @ApiProperty({ nullable: true, example: '978-0-00-000000-0' })
  isbn!: string | null;

  @ApiProperty({ nullable: true, example: '863' })
  classification!: string | null;

  @ApiProperty({
    nullable: true,
    example: 'https://example.org/biblioteca-digital/cien-anos-de-soledad',
  })
  digitalUrl!: string | null;

  @ApiProperty({ type: [WorkCopyDto] })
  copies!: WorkCopyDto[];
}

export class FilterOptionsResponseDto {
  @ApiProperty({ type: [CategoryRefDto], description: 'Ordenado por nombre' })
  data!: CategoryRefDto[];
}
