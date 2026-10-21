import { z } from 'zod';

export type Endpoint = {
  method: string;
  path: string;
  summary: string;
  schema: z.ZodTypeAny;
  response: string;
  handle: (raw: unknown, params: Record<string, string>) => Promise<unknown>;
};

/** Defines a typed adapter; parsing lives in the registry shared with OpenAPI generation. */
export function endpoint<T extends z.ZodTypeAny>(
  method: string,
  path: string,
  summary: string,
  schema: T,
  response: string,
  operation: (
    input: z.infer<T>,
    params: Record<string, string>,
  ) => Promise<unknown>,
): Endpoint {
  return {
    method,
    path,
    summary,
    schema,
    response,
    handle: async (raw, params) => operation(schema.parse(raw), params),
  };
}
