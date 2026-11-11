import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Res,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { GenerateEntranceQr } from '../application/generate-entrance-qr.use-case';
import { GenerateRoomQr } from '../application/generate-room-qr.use-case';
import { QrImage } from '../application/qr-image';
import { CatalogErrorsFilter } from './catalog-errors.filter';

const PNG_BODY = {
  description: 'Imagen PNG lista para imprimir (1024 px, margen de silencio)',
  content: {
    'image/png': { schema: { type: 'string', format: 'binary' } },
  },
};

@ApiTags('catalog')
@Controller('rooms')
@UseFilters(CatalogErrorsFilter)
export class RoomsController {
  constructor(
    private readonly entranceQr: GenerateEntranceQr,
    private readonly roomQr: GenerateRoomQr,
  ) {}

  @Get('qr')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'QR general de entrada',
    description: 'Abre el buscador sin filtro. Solo codifica una URL pública.',
  })
  @ApiProduces('image/png')
  @ApiOkResponse(PNG_BODY)
  async entrance(@Res() res: Response): Promise<void> {
    this.send(res, await this.entranceQr.execute());
  }

  // TODO(HU-09 #36): proteger con roles STAFF y ADMIN cuando exista el guard
  @Get(':id/qr')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Descargar el QR de una sala',
    description:
      'Imagen para imprimir que abre el buscador con esa sala filtrada. Pensado para el panel del personal.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiProduces('image/png')
  @ApiOkResponse(PNG_BODY)
  @ApiBadRequestResponse({ description: 'El id no es un UUID' })
  @ApiNotFoundResponse({ description: 'La sala no existe' })
  async room(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ): Promise<void> {
    this.send(res, await this.roomQr.execute(id));
  }

  private send(res: Response, image: QrImage): void {
    res
      .status(200)
      .type('image/png')
      .setHeader(
        'Content-Disposition',
        `attachment; filename="${image.fileName}"`,
      );
    res.send(image.png);
  }
}
