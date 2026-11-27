import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError } from '../domain/iam-errors';
import {
  AccountProfile,
  READER_ACCOUNT_REPOSITORY,
  ReaderAccountRepository,
} from './ports/reader-account.repository';

/** HU-16: datos de la cuenta con sesión (nombre, correo y aceptación del aviso). */
@Injectable()
export class GetMyAccount {
  constructor(
    @Inject(READER_ACCOUNT_REPOSITORY)
    private readonly accounts: ReaderAccountRepository,
  ) {}

  async execute(userId: string): Promise<AccountProfile> {
    const profile = await this.accounts.getProfile(userId);
    if (!profile) throw new InvalidCredentialsError();
    return profile;
  }
}
