import { Inject, Injectable } from '@nestjs/common';
import {
  CopyUpdate,
  type CopyUpdateInput,
} from '../../domain/entities/copy-update';
import {
  CopyNotFoundError,
  ShelfNotFoundError,
} from '../../domain/errors/copy.errors';
import {
  COPY_MANAGEMENT_REPOSITORY,
  type CopyChanges,
  type CopyManagementRepository,
  type CopyView,
} from '../ports/copy-management.repository';

/** HU-11: el personal cambia el estante o el estado de un ejemplar. */
@Injectable()
export class UpdateCopyUseCase {
  constructor(
    @Inject(COPY_MANAGEMENT_REPOSITORY)
    private readonly copies: CopyManagementRepository,
  ) {}

  async execute(copyId: string, input: CopyUpdateInput): Promise<CopyView> {
    const update = CopyUpdate.create(input);
    const circulation = await this.copies.findCirculation(copyId);
    if (!circulation) throw new CopyNotFoundError();
    if (update.shelfId && !(await this.copies.shelfExists(update.shelfId))) {
      throw new ShelfNotFoundError();
    }
    update.assertAllowedFor(circulation);

    const changes: CopyChanges = {};
    if (update.shelfId) changes.shelfId = update.shelfId;
    if (update.status) changes.status = update.status;
    return this.copies.update(copyId, changes);
  }
}
