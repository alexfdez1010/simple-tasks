import { ApiError } from '@/lib/api/errors';
export const MAX_BODY_BYTES = 65_536;

/** Reads bounded UTF-8 JSON, rejecting missing media types, oversized streams and malformed bodies. */
export async function readJsonBody(request: Request): Promise<unknown> {
  if (
    request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  )
    throw new ApiError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Use Content-Type: application/json.',
    );
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES)
    throw new ApiError(
      413,
      'PAYLOAD_TOO_LARGE',
      'JSON bodies may contain at most 64 KiB.',
    );
  const reader = request.body?.getReader();
  if (!reader)
    throw new ApiError(400, 'INVALID_JSON', 'Provide a JSON object.');
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
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new ApiError(400, 'INVALID_JSON', 'Provide valid JSON.');
  }
}
