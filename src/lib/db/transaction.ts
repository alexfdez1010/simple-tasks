import { Prisma, type PrismaClient } from '@/generated/prisma';

const MAX_TRANSACTION_ATTEMPTS = 3;

/** Runs an interactive serializable transaction and retries write conflicts. */
export async function runSerializable<T>(
  client: PrismaClient,
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_TRANSACTION_ATTEMPTS; attempt += 1) {
    try {
      return await client.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      const isRetryable =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034';
      if (!isRetryable || attempt === MAX_TRANSACTION_ATTEMPTS) throw error;
    }
  }
  throw new Error('No se pudo completar la transacción.');
}
