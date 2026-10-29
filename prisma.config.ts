import 'dotenv/config';

import { defineConfig, env } from 'prisma/config';

/** Centralizes Prisma schema, migration, seed, and datasource configuration. */
export default defineConfig({
  schema: 'prisma',
  engine: 'classic',
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED || env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun prisma/seed.ts',
  },
});
