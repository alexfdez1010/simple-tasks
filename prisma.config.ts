import 'dotenv/config';

import { defineConfig } from 'prisma/config';

/** Centralizes Prisma schema, migration, seed, and datasource configuration. */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun prisma/seed.ts',
  },
});
