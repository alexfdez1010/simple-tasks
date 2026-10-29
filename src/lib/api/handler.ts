import 'server-only';
import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db/client';
import { authenticateApi } from '@/lib/api/auth';
import { readJsonBody } from '@/lib/api/body';
import { matchEndpoints } from '@/lib/api/endpoints';
import { ApiError, apiErrorResponse } from '@/lib/api/errors';
import {
  API_LIMIT,
  API_WRITE_LIMIT,
  INSTANCE_LIMIT,
  consumeRateLimit,
} from '@/lib/api/rate-limit';
import { idSchema } from '@/lib/validation/common';

/** Authenticates, budgets, validates and dispatches one REST request; all responses disable caching. */
export async function handleApiRequest(
  request: Request,
  path: string,
): Promise<Response> {
  const requestId = randomUUID();
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Request-Id': requestId,
  });
  let response: Response;
  try {
    const instance = await consumeRateLimit(
      db,
      'instance',
      false,
      INSTANCE_LIMIT,
    );
    if (!instance.allowed) {
      headers.set('Retry-After', String(instance.retryAfter));
      throw new ApiError(
        429,
        'RATE_LIMITED',
        'The instance request budget is exhausted. Retry later.',
      );
    }
    const token = await authenticateApi(request);
    const write = !['GET', 'HEAD', 'OPTIONS'].includes(request.method);
    const budget = await consumeRateLimit(db, `token:${token.id}`, write);
    headers.set('X-RateLimit-Limit', String(API_LIMIT));
    headers.set('X-RateLimit-Remaining', String(budget.remaining));
    headers.set('X-RateLimit-Write-Limit', String(API_WRITE_LIMIT));
    headers.set('X-RateLimit-Write-Remaining', String(budget.writesRemaining));
    headers.set(
      'X-RateLimit-Reset',
      String((Math.floor(Date.now() / 60_000) + 1) * 60),
    );
    if (!budget.allowed) {
      headers.set('Retry-After', String(budget.retryAfter));
      throw new ApiError(
        429,
        'RATE_LIMITED',
        'The token request budget is exhausted. Retry later.',
      );
    }
    if (write && !token.canWrite)
      throw new ApiError(403, 'FORBIDDEN', 'This token only allows reading.');
    const matches = matchEndpoints(path);
    if (!matches.length)
      throw new ApiError(404, 'NOT_FOUND', 'The endpoint does not exist.');
    const match = matches.find(
      ({ endpoint }) => endpoint.method === request.method,
    );
    if (!match) {
      headers.set(
        'Allow',
        [...new Set(matches.map(({ endpoint }) => endpoint.method))].join(', '),
      );
      throw new ApiError(
        405,
        'METHOD_NOT_ALLOWED',
        'Use a supported HTTP method.',
      );
    }
    for (const value of Object.values(match.params)) idSchema.parse(value);
    const query = new URL(request.url).searchParams;
    if (new Set(query.keys()).size !== [...query.keys()].length)
      throw new ApiError(
        422,
        'VALIDATION_ERROR',
        'Do not repeat query parameters.',
      );
    if (write && query.size)
      throw new ApiError(
        422,
        'VALIDATION_ERROR',
        'Mutation endpoints do not accept query parameters.',
      );
    const raw = ['POST', 'PATCH', 'PUT'].includes(request.method)
      ? await readJsonBody(request)
      : Object.fromEntries(query);
    const result = await match.endpoint.handle(raw, match.params);
    await db.apiToken.updateMany({
      where: { id: token.id, revokedAt: null },
      data: { lastUsedAt: new Date() },
    });
    if (write) {
      revalidatePath('/');
      revalidatePath('/statistics');
    }
    response =
      match.endpoint.response === 'Empty'
        ? new Response(null, { status: 204 })
        : Response.json(
            match.endpoint.response === 'TasksPage' ? result : { data: result },
            {
              status:
                request.method === 'POST' &&
                !path.endsWith('/move') &&
                !path.endsWith('/start') &&
                !path.endsWith('/submit-review') &&
                !path.endsWith('/review')
                  ? 201
                  : 200,
            },
          );
  } catch (error) {
    response = apiErrorResponse(error, requestId);
  }
  if (response.status === 401)
    headers.set('WWW-Authenticate', 'Bearer realm="Simple Tasks API"');
  headers.forEach((value, name) => response.headers.set(name, value));
  return response;
}
