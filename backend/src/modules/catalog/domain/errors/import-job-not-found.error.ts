export class ImportJobNotFoundError extends Error {
  constructor(id: string) {
    super(`No se encontró el registro de importación ${id}`);
    this.name = 'ImportJobNotFoundError';
  }
}
