import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { CreateStaffUser } from '../application/create-staff-user.use-case';
import { ListStaffUsers } from '../application/list-staff-users.use-case';
import { SetUserActive } from '../application/set-user-active.use-case';
import {
  CreateStaffUserDto,
  CreatedUserResponseDto,
  UpdateUserDto,
  UserListResponseDto,
} from './dto/users.dto';
import { AuthenticatedRequest, JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './guards/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { IamErrorsFilter } from './iam-errors.filter';

/** HU-18: gestión de cuentas del personal. Solo administradores. */
@ApiTags('users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida' })
@ApiForbiddenResponse({ description: 'Solo administradores' })
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@UseFilters(IamErrorsFilter)
export class UsersController {
  constructor(
    private readonly listStaff: ListStaffUsers,
    private readonly createStaff: CreateStaffUser,
    private readonly setActive: SetUserActive,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar personal y administradores' })
  @ApiOkResponse({ type: UserListResponseDto })
  async list(): Promise<UserListResponseDto> {
    const users = await this.listStaff.execute();
    return {
      data: users.map((user) => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
      })),
    };
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Crear una cuenta de personal (rol STAFF)' })
  @ApiCreatedResponse({ type: CreatedUserResponseDto })
  @ApiConflictResponse({ description: 'Ya existe una cuenta con ese correo' })
  create(@Body() dto: CreateStaffUserDto): Promise<CreatedUserResponseDto> {
    return this.createStaff.execute(dto);
  }

  @Patch(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Activar o desactivar una cuenta',
    description:
      'Desactivar revoca sus sesiones. Un administrador no puede desactivarse a sí mismo.',
  })
  @ApiNoContentResponse({ description: 'Cuenta actualizada' })
  @ApiNotFoundResponse({ description: 'Cuenta no encontrada' })
  @ApiConflictResponse({ description: 'No puede desactivar su propia cuenta' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await this.setActive.execute({
      actorId: request.auth!.userId,
      targetId: id,
      active: dto.active,
    });
  }
}
