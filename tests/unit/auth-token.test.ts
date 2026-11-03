import { describe, expect, it } from 'vitest';
import { safeReturnPath } from '@/lib/auth/navigation';

describe('authentication return paths', () => {
  it.each([
    null,
    '',
    '//evil.test',
    'https://evil.test',
    '/\\evil.test',
    '/login',
    '/\n/evil.test',
  ])('rejects unsafe or looping return path %s', (path) => {
    expect(safeReturnPath(path)).toBe('/');
  });
  it('preserves same-origin paths and query parameters', () => {
    expect(safeReturnPath('/oauth/consent?code=abc')).toBe(
      '/oauth/consent?code=abc',
    );
  });
});
