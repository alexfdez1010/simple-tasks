import 'server-only';
import { z } from 'zod';
import type { PrismaClient } from '@/generated/prisma';
import {
  coordinatedTask,
  coordinatedTaskInclude,
} from '@/lib/coordination/read-model';
import { ApiError } from '@/lib/api/errors';
import { taskQuery } from '@/lib/api/schemas';
import { idSchema } from '@/lib/validation/common';

/** Decodes an opaque keyset cursor without depending on the previous task's existence. */
export function decodeCursor(cursor: string): string {
  try {
    return idSchema
      .regex(/^[a-zA-Z0-9_-]+$/)
      .parse(Buffer.from(cursor, 'base64url').toString('utf8'));
  } catch {
    throw new ApiError(
      422,
      'INVALID_CURSOR',
      'Use the nextCursor returned by the previous page.',
    );
  }
}

/** Lists all task history in stable id order with bounded keyset pagination and optional filters.
 * @param client - Injected Prisma connection.
 * @param input - Validated query (defaults to 50, at most 100 tasks).
 * @returns A page and opaque continuation; no total scan and no 20-completion board cap.
 */
export async function listTaskPage(
  client: PrismaClient,
  input: z.infer<typeof taskQuery>,
) {
  const { limit, cursor, statusId, scope, search, assigneeId, projectId } =
    input;
  const rows = await client.task.findMany({
    where: {
      assigneeId,
      projectId,
      ...(cursor ? { id: { gt: decodeCursor(cursor) } } : {}),
      ...(statusId ? { statusId } : {}),
      ...(scope === 'all'
        ? {}
        : { status: { isTerminal: scope === 'completed' } }),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { id: 'asc' },
    take: limit + 1,
    include: coordinatedTaskInclude,
  });
  const hasMore = rows.length > limit;
  const data = rows.slice(0, limit).map(coordinatedTask);
  const last = data.at(-1);
  return {
    data,
    pagination: {
      limit,
      hasMore,
      nextCursor:
        hasMore && last ? Buffer.from(last.id).toString('base64url') : null,
    },
  };
}
