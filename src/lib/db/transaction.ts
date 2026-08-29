import { Prisma, type PrismaClient } from '@/generated/prisma';

const MAX_TRANSACTION_ATTEMPTS = 5;
const BASE_RETRY_DELAY_MS = 10;

/** Waits with bounded exponential backoff before retrying a write conflict. */
function waitForTransactionRetry(attempt: number): Promise<void> {
  const delay = BASE_RETRY_DELAY_MS * 2 ** (attempt - 1);
  return new Promise((resolve) => setTimeout(resolve, delay));
}

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
      await waitForTransactionRetry(attempt);
    }
  }
  throw new Error('The transaction could not be completed.');
}
