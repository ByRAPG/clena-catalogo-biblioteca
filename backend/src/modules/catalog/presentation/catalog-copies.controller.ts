import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
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
import { UpdateCopyUseCase } from '../application/use-cases/update-copy.use-case';
import { CatalogErrorsFilter } from './catalog-errors.filter';
import {
  CopyResponseDto,
  ShelfListDto,
  UpdateCopyDto,
} from './dto/update-copy.dto';

/** HU-11: editar ubicación y estado de un ejemplar. Solo personal y administradores. */
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
  ) {}

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
