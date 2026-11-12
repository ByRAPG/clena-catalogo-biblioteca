import { Email } from './email.vo';
import { InvalidEmailError } from './iam-errors';

describe('Email', () => {
  it('normaliza espacios y mayúsculas', () => {
    expect(Email.create('  Personal@Example.ORG ').value).toBe(
      'personal@example.org',
    );
  });

  it('compara por valor', () => {
    expect(Email.create('A@x.org').equals(Email.create('a@X.org'))).toBe(true);
    expect(Email.create('a@x.org').equals(Email.create('b@x.org'))).toBe(false);
  });

  it.each(['', 'sin-arroba', 'a@b', 'a b@c.org'])('rechaza «%s»', (value) => {
    expect(() => Email.create(value)).toThrow(InvalidEmailError);
  });

  it('rechaza un correo de más de 254 caracteres', () => {
    expect(() => Email.create(`${'x'.repeat(250)}@a.org`)).toThrow(
      InvalidEmailError,
    );
  });
});
