/** Base operational error safe to expose at an application boundary. */
export class DomainError extends Error {
  /** Creates a domain error with a stable machine-readable code. */
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

/** Creates a missing-resource error. */
export function notFound(resource: string): DomainError {
  return new DomainError(`${resource} does not exist.`, 'NOT_FOUND');
}

/** Creates an invariant or state-conflict error. */
export function conflict(message: string): DomainError {
  return new DomainError(message, 'CONFLICT');
}

/** Converts unknown failures into user-safe action messages. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof DomainError) return error.message;
  if (error instanceof Error && error.name === 'ZodError') {
    return 'The submitted data is invalid.';
  }
  return 'The operation could not be completed.';
}
