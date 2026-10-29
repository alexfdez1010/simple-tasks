import type { Prisma } from '@/generated/prisma';
import { notFound } from '@/lib/validation/errors';

/** Validates an optional project reference before task writes commit. */
export async function assertProject(
  transaction: Prisma.TransactionClient,
  id: string,
) {
  if (!(await transaction.project.findUnique({ where: { id } })))
    throw notFound('The project');
}
