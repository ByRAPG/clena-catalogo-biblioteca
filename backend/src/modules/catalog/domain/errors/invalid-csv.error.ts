export class InvalidCsvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCsvError';
  }
}
