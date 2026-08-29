import 'server-only';

import { PrismaClient } from '@/generated/prisma';

const globalDatabase = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

/** Creates a configured Prisma client for the application process. */
function createDatabaseClient(): PrismaClient {
  return new PrismaClient({
    errorFormat: process.env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
  });
}

export const db = globalDatabase.prisma ?? createDatabaseClient();

if (process.env.NODE_ENV !== 'production') globalDatabase.prisma = db;
