import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ImportCatalogUseCase } from '../application/use-cases/import-catalog.use-case';
import { GetImportTemplateUseCase } from '../application/use-cases/get-import-template.use-case';
import type { ImportCatalogReport } from '../application/dto/import-catalog-report';
import { InvalidCsvError } from '../domain/errors/invalid-csv.error';
import { ImportAdminGuard } from './guards/import-admin.guard';
import type { ImportRequest } from './guards/import-admin.guard';
import { ImportCatalogDto } from './dto/import-catalog.dto';
import { ImportCatalogReportDto } from './dto/import-catalog-report.dto';

@ApiTags('Importación del catálogo')
@Controller('catalog/imports')
export class ImportCatalogController {
  constructor(
    private readonly importCatalog: ImportCatalogUseCase,
    private readonly getTemplate: GetImportTemplateUseCase,
  ) {}

  @Get('template')
  @ApiOperation({ summary: 'Descargar la plantilla CSV con datos ficticios' })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header(
    'Content-Disposition',
    'attachment; filename="plantilla-catalogo.csv"',
  )
  @ApiOkResponse({ description: 'Plantilla CSV', schema: { type: 'string' } })
  template(): Promise<string> {
    return this.getTemplate.execute();
  }

  @Post()
  @HttpCode(200)
  @UseGuards(ImportAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Importar filas válidas y reportar errores por fila',
  })
  @ApiOkResponse({
    type: ImportCatalogReportDto,
    description:
      'Reporte por fila y totales de ejemplares creados, actualizados y fallidos',
  })
  @ApiBadRequestResponse({ description: 'Archivo inválido' })
  @ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida' })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  @ApiServiceUnavailableResponse({
    description: 'Integración con IAM pendiente',
  })
  async import(
    @Body() dto: ImportCatalogDto,
    @Req() request: ImportRequest,
  ): Promise<ImportCatalogReport> {
    try {
      return await this.importCatalog.execute(
        dto.content,
        dto.fileName,
        request.importPrincipal.userId,
      );
    } catch (error: unknown) {
      if (error instanceof InvalidCsvError)
        throw new BadRequestException(error.message);
      throw error;
    }
  }
}
