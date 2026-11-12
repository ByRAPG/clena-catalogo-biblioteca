import { GetImportTemplateUseCase } from './get-import-template.use-case';

describe('GetImportTemplateUseCase', () => {
  it('devuelve el contenido de la plantilla desde su puerto', async () => {
    const reader = { read: jest.fn().mockResolvedValue('titulo,autor') };
    await expect(new GetImportTemplateUseCase(reader).execute()).resolves.toBe(
      'titulo,autor',
    );
    expect(reader.read).toHaveBeenCalledTimes(1);
  });
});
