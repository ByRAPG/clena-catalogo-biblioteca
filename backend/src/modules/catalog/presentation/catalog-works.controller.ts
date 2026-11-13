import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RegisterWorkUseCase } from '../application/use-cases/register-work.use-case';
import { SuggestCatalogTermsUseCase } from '../application/use-cases/suggest-catalog-terms.use-case';
import { JwtAuthGuard } from '../../iam/presentation/guards/jwt-auth.guard';
import { Roles } from '../../iam/presentation/guards/roles.decorator';
import { RolesGuard } from '../../iam/presentation/guards/roles.guard';
import { CatalogErrorsFilter } from './catalog-errors.filter';
import {
  CatalogTermListDto,
  SuggestTermsQueryDto,
} from './dto/catalog-term.dto';
import { RegisterWorkDto, RegisteredWorkDto } from './dto/register-work.dto';

/** HU-10: registrar libros a mano. Solo personal y administradores. */
@ApiTags('catalog')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida' })
@ApiForbiddenResponse({ description: 'Solo personal y administradores' })
@Controller('catalog')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF', 'ADMIN')
@UseFilters(CatalogErrorsFilter)
export class CatalogWorksController {
  constructor(
    private readonly registerWork: RegisterWorkUseCase,
    private readonly suggestTerms: SuggestCatalogTermsUseCase,
  ) {}

  @Post('works')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Registrar un libro nuevo',
    description:
      'Crea la obra con título, autores, temas, categoría y año. Los autores y temas que ya existen se reutilizan. Los ejemplares se registran aparte (HU-19).',
  })
  @ApiCreatedResponse({ type: RegisteredWorkDto })
  @ApiBadRequestResponse({
    description:
      'Falta el título o el autor, el año no es válido o la categoría no existe',
  })
  register(@Body() dto: RegisterWorkDto): Promise<RegisteredWorkDto> {
    return this.registerWork.execute(dto);
  }

  @Get('authors')
  @ApiOperation({ summary: 'Sugerir autores existentes mientras se escribe' })
  @ApiOkResponse({ type: CatalogTermListDto })
  async authors(
    @Query() query: SuggestTermsQueryDto,
  ): Promise<CatalogTermListDto> {
    return { data: await this.suggestTerms.execute('authors', query.q ?? '') };
  }

  @Get('subjects')
  @ApiOperation({ summary: 'Sugerir temas existentes mientras se escribe' })
  @ApiOkResponse({ type: CatalogTermListDto })
  async subjects(
    @Query() query: SuggestTermsQueryDto,
  ): Promise<CatalogTermListDto> {
    return { data: await this.suggestTerms.execute('subjects', query.q ?? '') };
  }
}
