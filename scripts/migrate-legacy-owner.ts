import 'dotenv/config';
import { PrismaClient } from '@/generated/prisma';
import { migrateLegacyOwner } from '@/lib/auth/provision';

const db = new PrismaClient();
try {
  if (
    await migrateLegacyOwner(
      db,
      process.env.LEGACY_OWNER_EMAIL,
      process.env.PASSWORD,
    )
  )
    console.info(
      'Legacy owner migrated to Better Auth. Authenticator enrollment is required.',
    );
} catch {
  console.error(
    'Legacy owner migration failed. Existing credentials were not replaced.',
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
