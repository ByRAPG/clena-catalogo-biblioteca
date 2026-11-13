/** Campo del formulario «Registrar libro» al que se refiere el error. */
export type WorkField = 'title' | 'authors' | 'year' | 'categoryId';

/** Datos de la obra inválidos (HU-10): el mensaje se muestra junto al campo. */
export class InvalidWorkError extends Error {
  constructor(
    public readonly field: WorkField,
    message: string,
  ) {
    super(message);
    this.name = 'InvalidWorkError';
  }
}
