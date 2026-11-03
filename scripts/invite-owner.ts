import 'dotenv/config';
import { chmod, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { PrismaClient } from '@/generated/prisma';
import { issueOwnerInvitation } from '@/lib/auth/owner-invitation';

const db = new PrismaClient({ transactionOptions: { timeout: 30_000 } });
try {
  const origin = new URL(process.env.BETTER_AUTH_URL!).origin;
  const destination =
    process.env.OWNER_INVITATION_FILE ?? '.vercel/owner-invitation.txt';
  await mkdir(dirname(destination), { recursive: true, mode: 0o700 });
  const token = await issueOwnerInvitation(db, {
    email: process.env.AUTH_OWNER_EMAIL ?? '',
    replaceOwnerId: process.env.REPLACE_OWNER_ID,
  });

  await writeFile(destination, `${origin}/register#invite=${token}\n`, {
    mode: 0o600,
  });
  await chmod(destination, 0o600);
  console.info(
    'Private one-use signup link saved. No password has been generated or reused.',
  );
} catch {
  console.error(
    'Could not issue the invitation. Check the email, output file and existing owner.',
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
