import 'server-only';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { endpoints } from '@/lib/api/endpoints';
import { responseSchemas } from '@/lib/api/response-schemas';
import type { Endpoint } from '@/lib/api/endpoint';

/** Builds one operation from the actual request validator and response contract. */
function operation(endpoint: Endpoint) {
  const { method, path, summary, schema, response } = endpoint;
  const json = zodToJsonSchema(schema, {
    target: 'openApi3',
    $refStrategy: 'none',
  }) as { properties?: Record<string, unknown>; required?: string[] };
  const parameters: unknown[] = [...path.matchAll(/\{(\w+)\}/g)].map(
    (match) => ({
      name: match[1],
      in: 'path',
      required: true,
      schema: { type: 'string', minLength: 1, maxLength: 191 },
    }),
  );
  if (method === 'GET')
    for (const [name, field] of Object.entries(json.properties ?? {}))
      parameters.push({
        name,
        in: 'query',
        required: json.required?.includes(name) ?? false,
        schema: field,
      });
  const status =
    response === 'Empty'
      ? '204'
      : method === 'POST' &&
          !path.endsWith('/move') &&
          !path.endsWith('/start') &&
          !path.endsWith('/submit-review') &&
          !path.endsWith('/review')
        ? '201'
        : '200';
  return {
    summary,
    operationId: `${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]+/g, '_')}`,
    tags: [
      path.startsWith('/properties')
        ? 'Properties'
        : path.startsWith('/statuses')
          ? 'Workflow'
          : 'Tasks',
    ],
    security: [{ bearerAuth: [] }],
    parameters,
    ...(['POST', 'PUT', 'PATCH'].includes(method) ||
    (method === 'DELETE' && Object.keys(json.properties ?? {}).length > 0)
      ? {
          requestBody: {
            required: method !== 'DELETE',
            content: { 'application/json': { schema: json } },
          },
        }
      : {}),
    responses: {
      [status]: {
        description:
          response === 'Empty' ? 'Completed; empty response body' : 'Success',
        headers: {
          'X-Request-Id': { schema: { type: 'string' } },
          'X-RateLimit-Remaining': { schema: { type: 'integer' } },
        },
        ...(response === 'Empty'
          ? {}
          : {
              content: {
                'application/json': {
                  schema: { $ref: `#/components/schemas/${response}` },
                },
              },
            }),
      },
      ...Object.fromEntries(
        [400, 401, 403, 404, 405, 409, 413, 415, 422, 429, 500].map((code) => [
          String(code),
          {
            description: (
              {
                400: 'Malformed JSON',
                401: 'Missing, invalid or revoked token',
                403: 'Write permission required',
                404: 'Resource or route not found',
                405: 'Unsupported method (Allow header)',
                409: 'Conflict with stored data',
                413: 'Body exceeds 64 KiB',
                415: 'JSON media type required',
                422: 'Validation failed',
                429: 'Rate limit reached',
                500: 'Unexpected failure',
              } as Record<number, string>
            )[code],
            ...(code === 429
              ? {
                  headers: {
                    'Retry-After': {
                      description: 'Seconds until retry',
                      schema: { type: 'integer' },
                    },
                  },
                }
              : {}),
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        ]),
      ),
    },
  };
}

/** Generates a secret-free, importable OpenAPI document from the live route registry. */
export function getOpenApiDocument() {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const endpoint of endpoints)
    (paths[endpoint.path] ??= {})[endpoint.method.toLowerCase()] =
      operation(endpoint);
  return {
    openapi: '3.0.3',
    info: {
      title: 'Simple Tasks API',
      version: '1.0.0',
      description:
        'Tasks, workflow and properties for one shared instance. Bearer tokens have read-only or read/write access, never expire, and can be revoked by the owner. Statistics are excluded. Fixed UTC-minute limits: 120 requests/token, 30 mutations/token, 600 requests/instance (including unauthorized calls). Retry 429 after Retry-After seconds. Bodies: JSON, max 64 KiB. Responses: no-store; errors include requestId. Pagination: stable id ascending, limit 1–100 (default 50); pass nextCursor with the same filters until hasMore=false. No snapshot isolation across pages. Do not automatically retry POST without verifying whether it succeeded; there is no idempotency-key support. CORS is intentionally restricted to same-origin; use server-to-server clients.',
    },
    servers: [{ url: '/api/v1' }],
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'st_<random secret>',
        },
      },
      schemas: Object.fromEntries(
        Object.entries(responseSchemas).map(([name, schema]) => [
          name,
          zodToJsonSchema(schema, { target: 'openApi3', $refStrategy: 'none' }),
        ]),
      ),
    },
  };
}
