import { resolveMatchedOn } from './matched-on';

describe('resolveMatchedOn', () => {
  it('devuelve null si nada coincidió', () => {
    expect(
      resolveMatchedOn({ title: null, author: null, subject: null }),
    ).toBeNull();
  });

  it('elige el origen con mayor puntuación', () => {
    expect(resolveMatchedOn({ title: 0.4, author: 1.2, subject: 0.9 })).toBe(
      'author',
    );
    expect(resolveMatchedOn({ title: null, author: null, subject: 0.5 })).toBe(
      'subject',
    );
  });

  it('en empate prefiere título, luego autor', () => {
    expect(resolveMatchedOn({ title: 1, author: 1, subject: 1 })).toBe('title');
    expect(resolveMatchedOn({ title: null, author: 1, subject: 1 })).toBe(
      'author',
    );
  });
});
