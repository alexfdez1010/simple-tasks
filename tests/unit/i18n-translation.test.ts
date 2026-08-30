import { describe, expect, it } from 'vitest';

import { translateErrorMessage } from '@/lib/i18n/error-messages';
import { translate, translations } from '@/lib/i18n/translations';

describe('application translations', () => {
  /** Proves both catalogs expose the same complete key set. */
  it('keeps English and Spanish catalog keys aligned', () => {
    expect(Object.keys(translations.es).sort()).toEqual(
      Object.keys(translations.en).sort(),
    );
  });

  /** Proves named values are interpolated without treating them as patterns. */
  it('interpolates dynamic values safely', () => {
    expect(
      translate('es', 'task.createIn', { status: 'Por hacer $& {x}' }),
    ).toBe('Crear tarea en Por hacer $& {x}');
  });

  /** Proves missing values remain visible instead of silently corrupting copy. */
  it('preserves an unresolved placeholder', () => {
    expect(translate('en', 'task.createIn')).toBe('Create task in {status}');
  });

  /** Proves stable domain errors localize only at the presentation boundary. */
  it('localizes a known domain error', () => {
    expect(translateErrorMessage('es', 'The task does not exist.')).toBe(
      'La tarea no existe.',
    );
  });

  /** Proves parameterized domain messages preserve their numeric context. */
  it('localizes the property limit with its configured count', () => {
    expect(
      translateErrorMessage('es', 'The board supports at most 100 properties.'),
    ).toBe('El tablero admite como máximo 100 propiedades.');
  });

  /** Proves already-safe unknown errors are not replaced with misleading copy. */
  it('preserves an unknown safe error', () => {
    expect(translateErrorMessage('es', 'A safe boundary message.')).toBe(
      'A safe boundary message.',
    );
  });
});
