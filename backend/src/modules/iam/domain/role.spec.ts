import { isRole } from './role';

describe('isRole', () => {
  it.each(['ADMIN', 'STAFF', 'READER'])('acepta %s', (value) => {
    expect(isRole(value)).toBe(true);
  });

  it.each(['admin', 'ROOT', '', null, 3])('rechaza %j', (value) => {
    expect(isRole(value)).toBe(false);
  });
});
