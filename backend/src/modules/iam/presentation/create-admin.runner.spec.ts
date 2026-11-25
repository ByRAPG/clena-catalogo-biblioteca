import { InvalidEmailError, WeakPasswordError } from '../domain/iam-errors';
import { DEFAULT_ADMIN_FULL_NAME, runCreateAdmin } from './create-admin.runner';

// Contraseña inventada solo para las pruebas.
const PASSWORD = 'una-clave-larga-de-prueba';
const env = { ADMIN_EMAIL: 'admin@example.org', ADMIN_PASSWORD: PASSWORD };
const created = { status: 'created', userId: 'u' };

describe('runCreateAdmin', () => {
  it('creado: código 0 y usa el nombre por defecto', async () => {
    const execute = jest.fn().mockResolvedValue(created);
    const out = await runCreateAdmin({ execute }, env);
    expect(out.exitCode).toBe(0);
    expect(out.message).not.toContain(PASSWORD);
    expect(execute).toHaveBeenCalledWith({
      email: 'admin@example.org',
      password: PASSWORD,
      fullName: DEFAULT_ADMIN_FULL_NAME,
      allowAdditional: false,
    });
  });

  it('ya existía: código 0', async () => {
    const execute = jest.fn().mockResolvedValue({ status: 'already-exists' });
    expect((await runCreateAdmin({ execute }, env)).exitCode).toBe(0);
  });

  it('administrador presente: código distinto de 0 y explica la opción', async () => {
    const execute = jest.fn().mockResolvedValue({ status: 'admin-present' });
    const out = await runCreateAdmin({ execute }, env);
    expect(out.exitCode).not.toBe(0);
    expect(out.message).toContain('ADMIN_ALLOW_ADDITIONAL=true');
  });

  it('ADMIN_ALLOW_ADDITIONAL=true y ADMIN_FULL_NAME se pasan al caso de uso', async () => {
    const execute = jest.fn().mockResolvedValue(created);
    await runCreateAdmin(
      { execute },
      { ...env, ADMIN_ALLOW_ADDITIONAL: 'true', ADMIN_FULL_NAME: 'Ana' },
    );
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({ allowAdditional: true, fullName: 'Ana' }),
    );
  });

  it('faltan variables: código distinto de 0 sin llamar al caso de uso', async () => {
    const execute = jest.fn();
    expect((await runCreateAdmin({ execute }, {})).exitCode).not.toBe(0);
    expect(
      (await runCreateAdmin({ execute }, { ADMIN_EMAIL: 'a@b.co' })).exitCode,
    ).not.toBe(0);
    expect(execute).not.toHaveBeenCalled();
  });

  it('validación fallida: código distinto de 0', async () => {
    for (const error of [
      new InvalidEmailError('x'),
      new WeakPasswordError('debe tener al menos 12 caracteres'),
    ]) {
      const execute = jest.fn().mockRejectedValue(error);
      const out = await runCreateAdmin({ execute }, env);
      expect(out.exitCode).not.toBe(0);
      expect(out.message).not.toContain(PASSWORD);
    }
  });

  it('error inesperado: no filtra el mensaje original', async () => {
    const execute = jest
      .fn()
      .mockRejectedValue(new Error(`fallo con ${PASSWORD} y un hash`));
    const out = await runCreateAdmin({ execute }, env);
    expect(out.exitCode).toBe(1);
    expect(out.message).not.toContain(PASSWORD);
  });
});
