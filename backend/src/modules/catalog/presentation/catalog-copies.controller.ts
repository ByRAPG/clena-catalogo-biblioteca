import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
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
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../iam/presentation/guards/jwt-auth.guard';
import { Roles } from '../../iam/presentation/guards/roles.decorator';
import { RolesGuard } from '../../iam/presentation/guards/roles.guard';
import { ListShelvesUseCase } from '../application/use-cases/list-shelves.use-case';
import { RegisterCopyUseCase } from '../application/use-cases/register-copy.use-case';
import { UpdateCopyUseCase } from '../application/use-cases/update-copy.use-case';
import { CatalogErrorsFilter } from './catalog-errors.filter';
import {
  CopyResponseDto,
  RegisterCopyDto,
  ShelfListDto,
  UpdateCopyDto,
} from './dto/update-copy.dto';

/**
 * Ejemplares: registrar (HU-19) y editar ubicación y estado (HU-11).
 * Solo personal y administradores.
 */
@ApiTags('catalog')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida' })
@ApiForbiddenResponse({ description: 'Solo personal y administradores' })
@Controller('catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
@UseFilters(CatalogErrorsFilter)
export class CatalogCopiesController {
  constructor(
    private readonly updateCopy: UpdateCopyUseCase,
    private readonly listShelves: ListShelvesUseCase,
    private readonly registerCopy: RegisterCopyUseCase,
  ) {}

  @Post('works/:id/copies')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Registrar un ejemplar de un libro',
    description:
      'Crea el ejemplar con su código de inventario y su estante (que fija sala y sección). El detalle público lo muestra de inmediato.',
  })
  @ApiParam({ name: 'id', format: 'uuid', description: 'Id del libro' })
  @ApiCreatedResponse({ type: CopyResponseDto })
  @ApiBadRequestResponse({
    description: 'Datos inválidos o estante inexistente',
  })
  @ApiNotFoundResponse({ description: 'El libro no existe' })
  @ApiConflictResponse({ description: 'El código de inventario ya existe' })
  register(
    @Param('id', ParseUUIDPipe) workId: string,
    @Body() dto: RegisterCopyDto,
  ): Promise<CopyResponseDto> {
    return this.registerCopy.execute(workId, dto);
  }

  @Patch('copies/:id')
  @ApiOperation({
    summary: 'Cambiar el estante o el estado de un ejemplar',
    description:
      'La búsqueda pública refleja el cambio de inmediato. El estado no se cambia si el ejemplar tiene un préstamo o una reserva activos; la ubicación sí.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: CopyResponseDto })
  @ApiBadRequestResponse({
    description:
      'Cuerpo vacío o inválido, id que no es UUID o estante inexistente',
  })
  @ApiNotFoundResponse({ description: 'El ejemplar no existe' })
  @ApiConflictResponse({
    description: 'El ejemplar tiene un préstamo o una reserva activos',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCopyDto,
  ): Promise<CopyResponseDto> {
    return this.updateCopy.execute(id, dto);
  }

  @Get('shelves')
  @ApiOperation({
    summary: 'Listar estantes con su sección y sala',
    description: 'Opciones de destino para reubicar un ejemplar.',
  })
  @ApiOkResponse({ type: ShelfListDto })
  async shelves(): Promise<ShelfListDto> {
    return { data: await this.listShelves.execute() };
  }
}
