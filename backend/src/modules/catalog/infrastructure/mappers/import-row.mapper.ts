import type { Prisma } from '@prisma/client';
import { normalizeText } from '../../../../shared/domain/normalize-text';
import type { ImportRow } from '../../domain/entities/import-row';

export class ImportRowMapper {
  static toPersistence(row: ImportRow, categoryId: string | null) {
    const data = row.data;
    return {
      title: data.title,
      isbn: data.isbn ?? null,
      classification: data.classification ?? null,
      year: data.year ?? null,
      publisher: data.publisher ?? null,
      categoryId,
      digitalUrl: data.digitalUrl ?? null,
      format: data.digitalUrl ? 'AMBOS' : 'FISICO',
      searchText: normalizeText(data.title),
    } satisfies Prisma.WorkUncheckedCreateInput;
  }
}
