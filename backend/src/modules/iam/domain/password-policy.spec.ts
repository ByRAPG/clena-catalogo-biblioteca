import { Email } from './email.vo';
import { WeakPasswordError } from './iam-errors';
import { assertPasswordAllowed } from './password-policy';

const email = Email.create('admin@example.org');

describe('assertPasswordAllowed', () => {
  it('acepta una contraseña de 12 caracteres distinta del correo', () => {
    expect(() => assertPasswordAllowed('a'.repeat(12), email)).not.toThrow();
  });

  it('rechaza menos de 12 caracteres', () => {
    expect(() => assertPasswordAllowed('a'.repeat(11), email)).toThrow(
      WeakPasswordError,
    );
  });

  it('rechaza más de 128 caracteres', () => {
    expect(() => assertPasswordAllowed('a'.repeat(129), email)).toThrow(
      WeakPasswordError,
    );
  });

  it('rechaza una contraseña igual al correo, sin importar mayúsculas', () => {
    expect(() => assertPasswordAllowed('Admin@Example.org', email)).toThrow(
      WeakPasswordError,
    );
  });

  it('el mensaje de error no contiene la contraseña', () => {
    const secret = 'corta-secreta';
    try {
      assertPasswordAllowed(secret.slice(0, 5), email);
    } catch (error) {
      expect((error as Error).message).not.toContain(secret.slice(0, 5));
    }
  });
});
