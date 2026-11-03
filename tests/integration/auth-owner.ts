import { db } from '@/lib/db/client';

/** Provides a verified disposable owner for integration tests issuing REST credentials. */
export async function seedApiOwner() {
  await db.user.upsert({
    where: { singleton: true },
    update: { twoFactorEnabled: true, passwordChangeRequired: false },
    create: {
      id: 'api-test-owner',
      email: 'api@example.test',
      name: 'API owner',
      twoFactorEnabled: true,
    },
  });
}
