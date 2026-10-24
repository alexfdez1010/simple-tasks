import { randomUUID } from 'node:crypto';
import { authenticateApi } from '@/lib/api/auth';
import { ApiError, apiErrorResponse } from '@/lib/api/errors';
import { consumeRateLimit, INSTANCE_LIMIT } from '@/lib/api/rate-limit';
import { db } from '@/lib/db/client';
import { dispatchWebhookBatch } from '@/lib/webhooks/dispatcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Drains five ready deliveries for a trusted scheduler using an existing read/write API token. */
async function dispatch(request: Request): Promise<Response> {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  const requestId = randomUUID();
  try {
    const token = await authenticateApi(request);
    if (!token.canWrite)
      throw new ApiError(
        403,
        'FORBIDDEN',
        'A read/write API token is required.',
      );
    const instance = await consumeRateLimit(
      db,
      'instance',
      false,
      INSTANCE_LIMIT,
    );
    const budget = await consumeRateLimit(db, `token:${token.id}`, true);
    if (!instance.allowed || !budget.allowed) {
      headers.set(
        'Retry-After',
        String(Math.max(instance.retryAfter, budget.retryAfter)),
      );
      throw new ApiError(429, 'RATE_LIMITED', 'Retry later.');
    }
    const processed = await dispatchWebhookBatch(db);
    await db.apiToken.updateMany({
      where: { id: token.id, revokedAt: null },
      data: { lastUsedAt: new Date() },
    });
    return Response.json({ data: { processed } }, { headers });
  } catch (error) {
    const response = apiErrorResponse(error, requestId);
    headers.forEach((value, key) => response.headers.set(key, value));
    return response;
  }
}

export { dispatch as GET, dispatch as POST };
