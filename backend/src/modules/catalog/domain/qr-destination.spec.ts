import {
  InvalidPublicWebUrlError,
  buildEntranceUrl,
  buildRoomUrl,
  slugify,
} from './qr-destination';

const ID = '3f2b8c1e-0000-4000-8000-000000000001';

describe('buildEntranceUrl', () => {
  it('apunta al buscador sin filtro', () => {
    expect(buildEntranceUrl('http://localhost:5173')).toBe(
      'http://localhost:5173/',
    );
  });

  it('conserva un prefijo de ruta y quita barras finales', () => {
    expect(buildEntranceUrl('https://clena.example/catalogo//')).toBe(
      'https://clena.example/catalogo/',
    );
  });

  it.each(['', 'no es url', 'ftp://clena.example', 'javascript:alert(1)'])(
    'rechaza «%s»',
    (value) => {
      expect(() => buildEntranceUrl(value)).toThrow(InvalidPublicWebUrlError);
    },
  );
});

describe('buildRoomUrl', () => {
  it('agrega la sala como parámetro, con o sin barra final', () => {
    const esperado = `https://clena.example/?sala=${ID}`;
    expect(buildRoomUrl('https://clena.example', ID)).toBe(esperado);
    expect(buildRoomUrl('https://clena.example/', ID)).toBe(esperado);
  });

  it('codifica el id', () => {
    expect(buildRoomUrl('http://x.test', 'a b&c')).toBe(
      'http://x.test/?sala=a%20b%26c',
    );
  });

  it('valida la URL base', () => {
    expect(() => buildRoomUrl('nada', ID)).toThrow(InvalidPublicWebUrlError);
  });
});

describe('slugify', () => {
  it('quita tildes y símbolos', () => {
    expect(slugify('Sala Caribe')).toBe('sala-caribe');
    expect(slugify('  Sala Colección Ñandú #2 ')).toBe(
      'sala-coleccion-nandu-2',
    );
  });

  it('usa «sala» si queda vacío', () => {
    expect(slugify('***')).toBe('sala');
  });
});
