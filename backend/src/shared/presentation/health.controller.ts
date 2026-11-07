import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetHealth } from '../application/get-health.use-case';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly getHealth: GetHealth) {}

  @Get()
  @ApiOperation({ summary: 'Estado de la API y de la base de datos' })
  @ApiOkResponse({
    type: HealthResponseDto,
    description: '`ok` si la base responde; `degraded` si no conecta.',
  })
  execute(): Promise<HealthResponseDto> {
    return this.getHealth.execute();
  }
}
