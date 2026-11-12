import { Injectable } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { IImportTemplateReader } from '../../application/ports/import-template-reader';

@Injectable()
export class FileImportTemplateReader implements IImportTemplateReader {
  read(): Promise<string> {
    return readFile(
      join(process.cwd(), 'prisma/data/plantilla-catalogo.csv'),
      'utf8',
    );
  }
}
