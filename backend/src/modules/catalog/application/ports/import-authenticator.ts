export interface ImportPrincipal {
  userId: string;
  role: 'ADMIN' | 'STAFF' | 'READER';
}

export interface IImportAuthenticator {
  authenticate(accessToken: string): Promise<ImportPrincipal | null>;
}
