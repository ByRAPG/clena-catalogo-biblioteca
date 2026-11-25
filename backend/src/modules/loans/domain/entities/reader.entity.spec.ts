import { InvalidReaderError } from '../errors/loan.errors';
import { NewReader } from './reader.entity';

describe('NewReader domain entity', () => {
  it('normaliza nombre, documento, correo y teléfono válidos', () => {
    const reader = NewReader.create({
      fullName: '  Doña   Carmen  Pérez ',
      documentId: ' 12345678 ',
      email: '  Carmen@Example.ORG ',
      phone: '  3001234567 ',
    });

    expect(reader.fullName).toBe('Doña Carmen Pérez');
    expect(reader.documentId).toBe('12345678');
    expect(reader.email).toBe('carmen@example.org');
    expect(reader.phone).toBe('3001234567');
  });

  it('convierte opcionales vacíos a null', () => {
    const reader = NewReader.create({
      fullName: 'Andrés Gómez',
      documentId: '   ',
      email: '',
      phone: null,
    });

    expect(reader.documentId).toBeNull();
    expect(reader.email).toBeNull();
    expect(reader.phone).toBeNull();
  });

  it('rechaza nombres muy cortos o muy largos', () => {
    expect(() => NewReader.create({ fullName: ' A ' })).toThrow(
      InvalidReaderError,
    );
    expect(() => NewReader.create({ fullName: 'a'.repeat(151) })).toThrow(
      InvalidReaderError,
    );
  });

  it('rechaza correo con formato inválido y documento/teléfono excesivos', () => {
    expect(() =>
      NewReader.create({ fullName: 'Luisa', email: 'correo-invalido' }),
    ).toThrow(InvalidReaderError);
    expect(() =>
      NewReader.create({ fullName: 'Luisa', documentId: '1'.repeat(41) }),
    ).toThrow(InvalidReaderError);
    expect(() =>
      NewReader.create({ fullName: 'Luisa', phone: '9'.repeat(31) }),
    ).toThrow(InvalidReaderError);
  });
});
