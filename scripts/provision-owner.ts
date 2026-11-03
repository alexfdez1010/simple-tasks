import 'dotenv/config';
import { PrismaClient } from '@/generated/prisma';
import { provisionOwner } from '@/lib/auth/provision';

const db = new PrismaClient();
try {
  await provisionOwner(db, {
    email: process.env.AUTH_OWNER_EMAIL ?? '',
    password: process.env.AUTH_OWNER_PASSWORD ?? '',
  });
  console.info(
    'Owner provisioned. Sign in and enroll an authenticator to unlock the application.',
  );
} catch {
  console.error(
    'Provisioning failed. Check the credentials and database; an existing owner cannot be replaced.',
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
