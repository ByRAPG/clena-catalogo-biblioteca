import { Inject, Injectable } from '@nestjs/common';
import {
  COPY_MANAGEMENT_REPOSITORY,
  type CopyManagementRepository,
  type ShelfOption,
} from '../ports/copy-management.repository';

/** HU-11: estantes de destino para reubicar un ejemplar. */
@Injectable()
export class ListShelvesUseCase {
  constructor(
    @Inject(COPY_MANAGEMENT_REPOSITORY)
    private readonly copies: CopyManagementRepository,
  ) {}

  execute(): Promise<ShelfOption[]> {
    return this.copies.listShelves();
  }
}
