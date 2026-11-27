import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/presentation/guards/jwt-auth.guard';
import { Roles } from '../../iam/presentation/guards/roles.decorator';
import { RolesGuard } from '../../iam/presentation/guards/roles.guard';
import { ListLoanAlertsUseCase } from '../application/use-cases/list-loan-alerts.use-case';
import { RequestAvailabilityAlertUseCase } from '../application/use-cases/request-availability-alert.use-case';
import { RunLoanAlertsUseCase } from '../application/use-cases/run-loan-alerts.use-case';
import {
  AvailabilityAlertDto,
  LoanAlertsPanelDto,
  LoanAlertsRunDto,
  RequestAvailabilityAlertDto,
  toAvailabilityAlertDto,
  toLoanAlertsPanelDto,
} from './dto/loan-alerts.dto';
import { LoansErrorsFilter } from './loans-errors.filter';

/** HU-21: alertas de devolución y disponibilidad. Solo personal y administradores. */
@ApiTags('loans')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida' })
@ApiForbiddenResponse({ description: 'Solo personal y administradores' })
@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
@UseFilters(LoansErrorsFilter)
export class LoanAlertsController {
  constructor(
    private readonly listAlerts: ListLoanAlertsUseCase,
    private readonly runAlerts: RunLoanAlertsUseCase,
    private readonly requestAlert: RequestAvailabilityAlertUseCase,
  ) {}

  @Get('alerts')
  @ApiOperation({
    summary: 'Panel de alertas',
    description:
      'Préstamos vencidos (primero) y por vencer en menos de 48 h, con el estado del correo, y avisos de disponibilidad pendientes.',
  })
  @ApiOkResponse({ type: LoanAlertsPanelDto })
  async alerts(): Promise<LoanAlertsPanelDto> {
    return toLoanAlertsPanelDto(await this.listAlerts.execute());
  }

  @Post('alerts/run')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Correr la revisión de avisos ahora',
    description:
      'La misma revisión que corre sola cada día. Se puede repetir: no envía dos veces el mismo aviso.',
  })
  @ApiOkResponse({ type: LoanAlertsRunDto })
  run(): Promise<LoanAlertsRunDto> {
    return this.runAlerts.execute();
  }

  @Post('availability-alerts')
  @ApiOperation({
    summary: 'Registrar «Avísame cuando esté disponible»',
    description:
      'El lector recibe un correo cuando se devuelve un ejemplar del libro.',
  })
  @ApiCreatedResponse({ type: AvailabilityAlertDto })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o lector sin correo',
  })
  @ApiNotFoundResponse({ description: 'El lector o el libro no existen' })
  @ApiConflictResponse({
    description: 'El libro ya está disponible o el aviso ya estaba pendiente',
  })
  async request(
    @Body() dto: RequestAvailabilityAlertDto,
  ): Promise<AvailabilityAlertDto> {
    return toAvailabilityAlertDto(
      await this.requestAlert.execute(dto.readerId, dto.workId),
    );
  }
}
