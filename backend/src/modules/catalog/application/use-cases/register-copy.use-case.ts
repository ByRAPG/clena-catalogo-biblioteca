import { Inject, Injectable } from '@nestjs/common';
import { NewCopy, type NewCopyInput } from '../../domain/entities/new-copy';
import {
  CopyWorkNotFoundError,
  InventoryCodeTakenError,
  ShelfNotFoundError,
} from '../../domain/errors/copy.errors';
import {
  COPY_MANAGEMENT_REPOSITORY,
  type CopyManagementRepository,
  type CopyView,
} from '../ports/copy-management.repository';

/** HU-19: el personal registra un ejemplar de un libro con código y estante. */
@Injectable()
export class RegisterCopyUseCase {
  constructor(
    @Inject(COPY_MANAGEMENT_REPOSITORY)
    private readonly copies: CopyManagementRepository,
  ) {}

  async execute(workId: string, input: NewCopyInput): Promise<CopyView> {
    const copy = NewCopy.create(input);
    if (!(await this.copies.workExists(workId))) {
      throw new CopyWorkNotFoundError();
    }
    if (!(await this.copies.shelfExists(copy.shelfId))) {
      throw new ShelfNotFoundError();
    }
    if (await this.copies.inventoryCodeExists(copy.inventoryCode)) {
      throw new InventoryCodeTakenError(copy.inventoryCode);
    }
    return this.copies.create(workId, copy);
  }
}
