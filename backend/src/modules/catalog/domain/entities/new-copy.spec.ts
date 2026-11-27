import { InvalidNewCopyError } from '../errors/copy.errors';
import { NewCopy } from './new-copy';

describe('NewCopy', () => {
  it('limpia el código y usa DISPONIBLE por defecto', () => {
    const copy = NewCopy.create({ inventoryCode: ' CLENA-1 ', shelfId: 's1' });
    expect(copy).toMatchObject({
      inventoryCode: 'CLENA-1',
      shelfId: 's1',
      status: 'DISPONIBLE',
    });
  });

  it('acepta un estado inicial editable', () => {
    expect(
      NewCopy.create({
        inventoryCode: 'C-1',
        shelfId: 's1',
        status: 'MANTENIMIENTO',
      }).status,
    ).toBe('MANTENIMIENTO');
  });

  it.each([
    ['código vacío', { inventoryCode: '  ', shelfId: 's1' }],
    ['código con espacios', { inventoryCode: 'CLENA 1', shelfId: 's1' }],
    ['código muy largo', { inventoryCode: 'X'.repeat(51), shelfId: 's1' }],
    ['sin estante', { inventoryCode: 'C-1', shelfId: ' ' }],
    [
      'estado PRESTADO',
      { inventoryCode: 'C-1', shelfId: 's1', status: 'PRESTADO' },
    ],
  ])('rechaza %s', (_caso, input) => {
    expect(() => NewCopy.create(input)).toThrow(InvalidNewCopyError);
  });
});
