import { ZodError } from 'zod';
import { Prisma } from '@/generated/prisma';
import { DomainError } from '@/lib/validation/errors';

/** Describes an HTTP failure with public metadata, without internal exception details. */
export class ApiError extends Error {
  /** Stores the public status and stable error code for the transport boundary. */
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Maps validation/domain/storage failures to a safe, consistent HTTP error envelope. */
export function apiErrorResponse(error: unknown, requestId: string): Response {
  let status = 500,
    code = 'INTERNAL_ERROR',
    message = 'The request could not be completed.';
  let details: unknown;
  if (error instanceof ApiError) ({ status, code, message } = error);
  else if (error instanceof ZodError) {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Check the submitted fields.';
    details = error.issues.map(({ path, message }) => ({
      path: path.join('.'),
      message,
    }));
  } else if (error instanceof DomainError) {
    status =
      (
        { NOT_FOUND: 404, CONFLICT: 409, UNAUTHORIZED: 401 } as Record<
          string,
          number
        >
      )[error.code] ?? 422;
    code = error.code;
    message = error.message;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (
      error.code === 'P2002' ||
      error.code === 'P2003' ||
      error.code === 'P2034'
    ) {
      status = 409;
      code = 'CONFLICT';
      message = 'The change conflicts with current data. Refresh and retry.';
    } else if (error.code === 'P2025') {
      status = 404;
      code = 'NOT_FOUND';
      message = 'The resource does not exist.';
    }
  }
  return Response.json(
    { error: { code, message, ...(details ? { details } : {}), requestId } },
    { status },
  );
}
