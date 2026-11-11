export class InvalidSearchCriteriaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSearchCriteriaError';
  }
}

export class WorkNotFoundError extends Error {
  constructor(id: string) {
    super(`No existe la obra ${id}`);
    this.name = 'WorkNotFoundError';
  }
}
