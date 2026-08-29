import { config } from 'dotenv';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

config({ path: '.env.test', override: false });
config({ override: false });

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    clearMocks: true,
    environment: 'node',
    exclude: ['tests/e2e/**', 'node_modules/**'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    isolate: true,
    restoreMocks: true,
    setupFiles: './tests/setup.ts',
    testTimeout: 10_000,
  },
});
