import { WebhookDocs } from '@/components/connections/webhook-docs';
import { getCurrentLanguage } from '@/lib/i18n/server';

/** Renders public documentation with illustrative data; no configuration or secrets are loaded. */
export default async function WebhookDocsPage() {
  return <WebhookDocs language={await getCurrentLanguage()} />;
}
