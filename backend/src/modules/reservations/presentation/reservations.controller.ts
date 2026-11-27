import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  AuthenticatedRequest,
  JwtAuthGuard,
} from '../../iam/presentation/guards/jwt-auth.guard';
import { Roles } from '../../iam/presentation/guards/roles.decorator';
import { RolesGuard } from '../../iam/presentation/guards/roles.guard';
import {
  CancelReservation,
  ListMyReservations,
  ReserveWork,
} from '../application/reservations.use-cases';
import {
  CreateReservationDto,
  ReservationListResponseDto,
  ReservationResponseDto,
  toReservationResponse,
} from './reservations.dto';
import { ReservationsErrorsFilter } from './reservations-errors.filter';

/** HU-14: reservas de los lectores con cuenta. Solo rol READER. */
@ApiTags('reservations')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida' })
@ApiForbiddenResponse({ description: 'Solo lectores con cuenta' })
@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('READER')
@UseFilters(ReservationsErrorsFilter)
export class ReservationsController {
  constructor(
    private readonly reserveWork: ReserveWork,
    private readonly listMine: ListMyReservations,
    private readonly cancelReservation: CancelReservation,
  ) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary: 'Reservar un ejemplar disponible de una obra',
    description:
      'Reserva un ejemplar concreto durante el plazo configurado (48 h por defecto). El ejemplar sigue figurando disponible en la búsqueda, pero el personal no puede prestarlo a otra persona mientras la reserva esté vigente.',
  })
  @ApiCreatedResponse({ type: ReservationResponseDto })
  @ApiNotFoundResponse({ description: 'Obra no encontrada' })
  @ApiConflictResponse({
    description:
      'Sin ejemplares disponibles o ya tiene una reserva activa de la obra',
  })
  async create(
    @Body() dto: CreateReservationDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ReservationResponseDto> {
    const record = await this.reserveWork.execute({
      userId: request.auth!.userId,
      workId: dto.workId,
    });
    return toReservationResponse(record);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Mis reservas activas' })
  @ApiOkResponse({ type: ReservationListResponseDto })
  async mine(
    @Req() request: AuthenticatedRequest,
  ): Promise<ReservationListResponseDto> {
    const records = await this.listMine.execute(request.auth!.userId);
    return { data: records.map(toReservationResponse) };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Cancelar una de mis reservas activas' })
  @ApiNoContentResponse({ description: 'Reserva cancelada' })
  @ApiNotFoundResponse({ description: 'Reserva no encontrada' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.cancelReservation.execute({
      userId: request.auth!.userId,
      reservationId: id,
    });
  }
}
