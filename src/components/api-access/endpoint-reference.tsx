import { zodToJsonSchema } from 'zod-to-json-schema';
import { spanishEndpointSummaries } from '@/components/api-access/endpoint-summaries';
import type { Language } from '@/lib/i18n/config';
import { endpoints } from '@/lib/api/endpoints';
import { responseSchemas } from '@/lib/api/response-schemas';
import type { ApiCopy } from '@/components/api-access/copy';

/** Renders searchable-by-browser endpoint details from the same contracts used for dispatch. */
export function EndpointReference({
  copy,
  language,
}: {
  copy: ApiCopy;
  language: Language;
}) {
  return (
    <section className="space-y-4" aria-labelledby="endpoints-heading">
      <h2 id="endpoints-heading" className="text-xl font-semibold">
        {copy.endpoints}
      </h2>
      <div className="divide-y divide-divider">
        {endpoints.map((endpoint) => {
          const schema = zodToJsonSchema(endpoint.schema, {
            target: 'openApi3',
            $refStrategy: 'none',
          });
          const response =
            responseSchemas[endpoint.response as keyof typeof responseSchemas];
          return (
            <details
              key={`${endpoint.method}:${endpoint.path}`}
              className="group py-4"
            >
              <summary className="min-h-11 cursor-pointer space-y-2 rounded-lg py-2 focus-visible:outline-2 focus-visible:outline-accent">
                <span className="inline-block w-16 font-mono text-xs font-semibold text-accent">
                  {endpoint.method}
                </span>
                <code className="break-all text-sm">{endpoint.path}</code>
                <span className="block text-sm leading-6 text-muted">
                  {language === 'es'
                    ? spanishEndpointSummaries[
                        `${endpoint.method} ${endpoint.path}`
                      ]
                    : endpoint.summary}
                </span>
              </summary>
              <div className="space-y-4 pb-4 pt-3">
                <h3 className="text-sm font-medium">{copy.request}</h3>
                <pre
                  className="max-h-96 overflow-auto rounded-xl bg-surface-secondary p-4 text-xs leading-6"
                  tabIndex={0}
                >
                  {JSON.stringify(schema, null, 2)}
                </pre>
                {response && (
                  <>
                    <h3 className="text-sm font-medium">{copy.response}</h3>
                    <pre
                      className="max-h-96 overflow-auto rounded-xl bg-surface-secondary p-4 text-xs leading-6"
                      tabIndex={0}
                    >
                      {JSON.stringify(
                        zodToJsonSchema(response, {
                          target: 'openApi3',
                          $refStrategy: 'none',
                        }),
                        null,
                        2,
                      )}
                    </pre>
                  </>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
