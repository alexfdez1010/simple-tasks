import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import manifest from '@/app/manifest';

/** Resolves icon files relative to the repository without depending on the process working directory. */
function asset(path: string) {
  return new URL(`../../public${path}`, import.meta.url).pathname;
}

describe('installable PWA identity', () => {
  it('keeps a stable root identity and standalone launch scope', () => {
    expect(manifest()).toMatchObject({
      id: '/',
      name: 'Simple Tasks',
      start_url: '/',
      scope: '/',
      display: 'standalone',
    });
  });

  it('ships actual correctly sized regular and maskable icons', async () => {
    for (const icon of manifest().icons!) {
      const metadata = await sharp(asset(icon.src)).metadata();
      expect(`${metadata.width}x${metadata.height}`).toBe(icon.sizes);
      expect(metadata.format).toBe('png');
    }
    expect(manifest().icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: '192x192', purpose: 'any' }),
        expect.objectContaining({ sizes: '512x512', purpose: 'any' }),
        expect.objectContaining({ sizes: '512x512', purpose: 'maskable' }),
      ]),
    );
  });

  it('derives the launcher artwork from the original logo without replacing it', async () => {
    const original = new URL('../../src/app/icon.png', import.meta.url)
      .pathname;
    const expected = await sharp(original).resize(192, 192).raw().toBuffer();
    const actual = await sharp(asset('/icons/icon-192.png')).raw().toBuffer();
    expect(actual.equals(expected)).toBe(true);
    const apple = await sharp(asset('/icons/apple-touch-icon.png')).metadata();
    expect([apple.width, apple.height, apple.hasAlpha]).toEqual([
      180,
      180,
      false,
    ]);
  });
});
