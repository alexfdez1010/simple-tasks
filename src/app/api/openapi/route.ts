import { getOpenApiDocument } from '@/lib/api/openapi';

/** Returns the public, secret-free API contract for documentation and client generators. */
export function GET() {
  return Response.json(getOpenApiDocument(), {
    headers: {
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
