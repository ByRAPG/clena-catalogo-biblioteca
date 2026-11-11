import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { GetWorkDetail } from '../application/get-work-detail.use-case';
import { ListSearchFilters } from '../application/list-search-filters.use-case';
import { SearchWorks } from '../application/search-works.use-case';
import {
  FilterOptionsResponseDto,
  SearchWorksResponseDto,
  WorkDetailDto,
} from './dto/search-response.dto';
import { SearchWorksQueryDto } from './dto/search-works-query.dto';
import { SearchErrorsFilter } from './search-errors.filter';

@ApiTags('search')
@Controller('search')
@UseFilters(SearchErrorsFilter)
export class SearchController {
  constructor(
    private readonly searchWorks: SearchWorks,
    private readonly getWorkDetail: GetWorkDetail,
    private readonly listFilters: ListSearchFilters,
  ) {}

  @Get('works')
  @ApiOperation({
    summary: 'Buscar obras',
    description:
      'Búsqueda tolerante a tildes, mayúsculas y errores de escritura por título, autor o tema, con filtros y paginación. Sin resultados responde 200 con `data: []`.',
  })
  @ApiOkResponse({ type: SearchWorksResponseDto })
  @ApiBadRequestResponse({ description: 'Parámetros inválidos' })
  works(@Query() query: SearchWorksQueryDto): Promise<SearchWorksResponseDto> {
    return this.searchWorks.execute({
      q: query.q,
      categoryId: query.categoryId,
      roomId: query.roomId,
      available: query.available === 'true' ? true : undefined,
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get('works/:id')
  @ApiOperation({
    summary: 'Detalle de una obra con sus ejemplares y ubicaciones',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: WorkDetailDto })
  @ApiBadRequestResponse({ description: 'El id no es un UUID' })
  @ApiNotFoundResponse({ description: 'La obra no existe' })
  detail(@Param('id', ParseUUIDPipe) id: string): Promise<WorkDetailDto> {
    return this.getWorkDetail.execute(id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Categorías para el filtro, ordenadas por nombre' })
  @ApiOkResponse({
    type: FilterOptionsResponseDto,
    description: 'Lista de categorías',
  })
  async categories(): Promise<FilterOptionsResponseDto> {
    return { data: await this.listFilters.categories() };
  }

  @Get('rooms')
  @ApiOperation({ summary: 'Salas para el filtro, ordenadas por nombre' })
  @ApiOkResponse({
    type: FilterOptionsResponseDto,
    description: 'Lista de salas',
  })
  async rooms(): Promise<FilterOptionsResponseDto> {
    return { data: await this.listFilters.rooms() };
  }
}
