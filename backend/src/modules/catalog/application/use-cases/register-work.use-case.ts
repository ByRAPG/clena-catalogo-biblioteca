import { Inject, Injectable } from '@nestjs/common';
import { NewWork, type NewWorkInput } from '../../domain/entities/new-work';
import { InvalidWorkError } from '../../domain/errors/invalid-work.error';
import {
  WORK_REGISTRATION_REPOSITORY,
  type RegisteredWork,
  type WorkRegistrationRepository,
} from '../ports/work-registration.repository';

/** HU-10: el personal registra un libro nuevo en el catálogo. */
@Injectable()
export class RegisterWorkUseCase {
  constructor(
    @Inject(WORK_REGISTRATION_REPOSITORY)
    private readonly works: WorkRegistrationRepository,
  ) {}

  async execute(
    input: NewWorkInput,
    currentYear = new Date().getFullYear(),
  ): Promise<RegisteredWork> {
    const work = NewWork.create(input, currentYear);
    if (
      work.categoryId &&
      !(await this.works.categoryExists(work.categoryId))
    ) {
      throw new InvalidWorkError('categoryId', 'La categoría no existe');
    }
    return this.works.create(work);
  }
}
