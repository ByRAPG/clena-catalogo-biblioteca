import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ImportCatalogUseCase } from '../application/use-cases/import-catalog.use-case';
import { GetImportTemplateUseCase } from '../application/use-cases/get-import-template.use-case';
import { SimulateCatalogImportUseCase } from '../application/use-cases/simulate-catalog-import.use-case';
import { GetImportErrorsCsvUseCase } from '../application/use-cases/get-import-errors-csv.use-case';
import type { ImportCatalogReport } from '../application/dto/import-catalog-report';
import { InvalidCsvError } from '../domain/errors/invalid-csv.error';
import { ImportJobNotFoundError } from '../domain/errors/import-job-not-found.error';
import { JwtAuthGuard } from '../../iam/presentation/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../iam/presentation/guards/jwt-auth.guard';
import { Roles } from '../../iam/presentation/guards/roles.decorator';
import { RolesGuard } from '../../iam/presentation/guards/roles.guard';
import { ImportCatalogDto } from './dto/import-catalog.dto';
import { ImportCatalogReportDto } from './dto/import-catalog-report.dto';

@ApiTags('Importación del catálogo')
@Controller('catalog/imports')
export class ImportCatalogController {
  constructor(
    private readonly importCatalog: ImportCatalogUseCase,
    private readonly simulateImport: SimulateCatalogImportUseCase,
    private readonly getImportErrorsCsv: GetImportErrorsCsvUseCase,
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Importar filas válidas y reportar errores por fila',
  })
  @ApiOkResponse({
    type: ImportCatalogReportDto,
    description:
      'Reporte por fila y totales de obras y ejemplares creados, actualizados y fallidos',
  })
  @ApiBadRequestResponse({ description: 'Archivo inválido' })
  @ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida' })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  async import(
    @Body() dto: ImportCatalogDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<ImportCatalogReport> {
    if (!request.auth) throw new UnauthorizedException('Debe iniciar sesión');
    const payload = this.extractPayload(dto);
    try {
      return await this.importCatalog.execute(
        payload,
        dto.fileName,
        request.auth.userId,
      );
    } catch (error: unknown) {
      if (error instanceof InvalidCsvError)
        throw new BadRequestException(error.message);
      throw error;
    }
  }

  @Post('preview')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Simular la importación sin escribir en la base de datos y mostrar obras/ejemplares afectados',
  })
  @ApiOkResponse({
    type: ImportCatalogReportDto,
    description:
      'Vista previa de obras y ejemplares que se crearían, actualizarían o fallarían sin modificar datos',
  })
  @ApiBadRequestResponse({ description: 'Archivo inválido' })
  @ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida' })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  async preview(@Body() dto: ImportCatalogDto): Promise<ImportCatalogReport> {
    const payload = this.extractPayload(dto);
    try {
      return await this.simulateImport.execute(payload);
    } catch (error: unknown) {
      if (error instanceof InvalidCsvError)
        throw new BadRequestException(error.message);
      throw error;
    }
  }

  @Post('preview/errors')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Header('Cache-Control', 'no-store')
  @ApiProduces('text/csv')
  @ApiOperation({
    summary:
      'Descargar en CSV el informe de errores por fila de una simulación previa',
  })
  @ApiOkResponse({
    description: 'Informe CSV de errores por fila (fila,campo,error)',
    schema: { type: 'string' },
  })
  @ApiBadRequestResponse({ description: 'Archivo inválido' })
  @ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida' })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  async previewErrors(
    @Body() dto: ImportCatalogDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const payload = this.extractPayload(dto);
    try {
      const report = await this.getImportErrorsCsv.fromSimulation(payload);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${report.fileName}"`,
      );
      return report.csv;
    } catch (error: unknown) {
      if (error instanceof InvalidCsvError)
        throw new BadRequestException(error.message);
      throw error;
    }
  }

  @Get(':id/errors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Header('Cache-Control', 'no-store')
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiProduces('text/csv')
  @ApiOperation({
    summary:
      'Descargar en CSV el informe de errores por fila de una importación ejecutada',
  })
  @ApiOkResponse({
    description: 'Informe CSV de errores por fila (fila,campo,error)',
    schema: { type: 'string' },
  })
  @ApiBadRequestResponse({ description: 'El id no es un UUID válido' })
  @ApiUnauthorizedResponse({ description: 'Sesión ausente o inválida' })
  @ApiForbiddenResponse({ description: 'Solo administradores' })
  @ApiNotFoundResponse({
    description: 'No existe un registro de importación con ese identificador',
  })
  async downloadErrors(
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    try {
      const report = await this.getImportErrorsCsv.fromImportJob(id);
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${report.fileName}"`,
      );
      return report.csv;
    } catch (error: unknown) {
      if (error instanceof ImportJobNotFoundError)
        throw new NotFoundException(error.message);
      throw error;
    }
  }

  private extractPayload(dto: ImportCatalogDto): string | Uint8Array {
    if (dto.contentBase64 !== undefined) {
      return Buffer.from(dto.contentBase64, 'base64');
    }
    if (dto.content !== undefined) {
      return dto.content;
    }
    throw new BadRequestException('Debe enviar el contenido del archivo CSV');
  }
}
