import { taskEndpoints } from '@/lib/api/task-endpoints';
import { configurationEndpoints } from '@/lib/api/configuration-endpoints';
import type { Endpoint } from '@/lib/api/endpoint';

export const endpoints = [...taskEndpoints, ...configurationEndpoints].sort(
  (a, b) => a.path.split('{').length - b.path.split('{').length,
);

/** Finds an exact path template before dynamic alternatives and extracts decoded identifiers. */
export function matchEndpoints(
  path: string,
): Array<{ endpoint: Endpoint; params: Record<string, string> }> {
  const matches = endpoints.flatMap((endpoint) => {
    const names = [...endpoint.path.matchAll(/\{(\w+)\}/g)].map(
      (match) => match[1],
    );
    const pattern = endpoint.path.replace(/\{\w+\}/g, '([^/]+)');
    const match = new RegExp(`^${pattern}$`).exec(path);
    return match
      ? [
          {
            endpoint,
            params: Object.fromEntries(
              names.map((name, index) => [name, match[index + 1]]),
            ),
          },
        ]
      : [];
  });
  const template = matches[0]?.endpoint.path;
  return matches.filter((match) => match.endpoint.path === template);
}
