import { Inject, Injectable } from '@nestjs/common';
import { IMPORT_TEMPLATE_READER } from '../tokens';
import type { IImportTemplateReader } from '../ports/import-template-reader';

@Injectable()
export class GetImportTemplateUseCase {
  constructor(
    @Inject(IMPORT_TEMPLATE_READER)
    private readonly reader: IImportTemplateReader,
  ) {}

  execute(): Promise<string> {
    return this.reader.read();
  }
}
