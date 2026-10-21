import 'server-only';
import type { PrismaClient } from '@/generated/prisma';

export const API_LIMIT = 120;
export const API_WRITE_LIMIT = 30;
export const INSTANCE_LIMIT = 600;

/** Atomically consumes a fixed UTC-minute budget in Postgres across all processes.
 * @param client - Injected database connection.
 * @param key - Trusted instance/token key; never derived from arbitrary request input.
 * @param write - Whether this request consumes the mutation sub-budget.
 * @param limit - Total requests allowed in the minute.
 * @returns Accepted flag, remaining total and seconds until reset; denied calls never inflate counts.
 */
export async function consumeRateLimit(
  client: PrismaClient,
  key: string,
  write: boolean,
  limit = API_LIMIT,
) {
  const rows = await client.$queryRaw<
    Array<{ count: number; writes: number; reset: number }>
  >`
    INSERT INTO "ApiRateLimit" AS bucket ("key", "windowStart", "count", "writes")
    VALUES (${key}, date_trunc('minute', timezone('UTC', now())), 1, ${write ? 1 : 0})
    ON CONFLICT ("key") DO UPDATE SET
      "windowStart" = EXCLUDED."windowStart",
      "count" = CASE WHEN bucket."windowStart" < EXCLUDED."windowStart" THEN 1 ELSE bucket."count" + 1 END,
      "writes" = CASE WHEN bucket."windowStart" < EXCLUDED."windowStart" THEN EXCLUDED."writes" ELSE bucket."writes" + EXCLUDED."writes" END
    WHERE bucket."windowStart" < EXCLUDED."windowStart"
      OR (bucket."count" < ${limit} AND (${!write} OR bucket."writes" < ${API_WRITE_LIMIT}))
    RETURNING "count", "writes", CEIL(EXTRACT(EPOCH FROM ("windowStart" + interval '1 minute' - timezone('UTC', now()))))::integer AS reset
  `;
  const row = rows[0];
  return {
    allowed: !!row,
    remaining: row ? limit - row.count : 0,
    writesRemaining: row ? API_WRITE_LIMIT - row.writes : 0,
    retryAfter: row?.reset ?? 60,
  };
}
