import { ApiError } from '@/lib/api/errors';
export const MAX_BODY_BYTES = 65_536;

/** Rejects non-JSON media types only when a JSON payload is required or present. */
function requireJsonMediaType(request: Request): void {
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    throw new ApiError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Use Content-Type: application/json.',
    );
}

/**
 * Reads bounded UTF-8 JSON and rejects malformed or oversized payloads.
 * @param request - The incoming HTTP request; its body stream is consumed once.
 * @param options - Allows a truly empty optional body, including Next.js empty DELETE streams, to normalize to an empty object.
 * @returns Parsed JSON or an empty object when explicitly allowed; nonempty bodies always require JSON media type.
 */
export async function readJsonBody(
  request: Request,
  { allowEmpty = false }: { allowEmpty?: boolean } = {},
): Promise<unknown> {
  if (!allowEmpty) requireJsonMediaType(request);
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES)
    throw new ApiError(
      413,
      'PAYLOAD_TOO_LARGE',
      'JSON bodies may contain at most 64 KiB.',
    );
  const reader = request.body?.getReader();
  if (!reader) {
    if (allowEmpty) return {};
    throw new ApiError(400, 'INVALID_JSON', 'Provide a JSON object.');
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new ApiError(
          413,
          'PAYLOAD_TOO_LARGE',
          'JSON bodies may contain at most 64 KiB.',
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (allowEmpty && size === 0) return {};
  if (allowEmpty) requireJsonMediaType(request);
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'Provide valid JSON.');
  }
}
