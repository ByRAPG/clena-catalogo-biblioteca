import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ enum: ['ok', 'degraded'], example: 'ok' })
  status!: 'ok' | 'degraded';

  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  database!: 'up' | 'down';

  @ApiProperty({
    enum: ['off', 'loading', 'ready', 'error'],
    example: 'ready',
    description:
      'Modelo de búsqueda semántica. Solo informa: un modelo caído no vuelve `degraded` a la API.',
  })
  semanticModel!: 'off' | 'loading' | 'ready' | 'error';

  @ApiProperty({
    description: 'Segundos desde que arrancó la API',
    example: 120,
  })
  uptime!: number;

  @ApiProperty({ example: '2026-11-12T15:04:05.000Z' })
  timestamp!: string;
}
