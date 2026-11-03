import { authDb, seedTestOwner } from './auth-fixture';

/** Provisions the disposable owner before any browser suite starts. */
export default async function setup() {
  await seedTestOwner();
  await authDb.$disconnect();
}
