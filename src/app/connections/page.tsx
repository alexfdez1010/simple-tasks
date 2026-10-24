import { readWebhookSettings } from '@/lib/webhooks/store';
import { scheduleWebhookDelivery } from '@/lib/webhooks/schedule';
import { ConnectionsContent } from '@/components/connections/connections-content';
import { requireAuthenticated } from '@/lib/auth/session';
import { getCurrentLanguage } from '@/lib/i18n/server';

export const maxDuration = 60;

/** Renders the protected integration entry point; credentials remain on their setup pages. */
export default async function ConnectionsPage() {
  await requireAuthenticated();
  const [language, webhook] = await Promise.all([
    getCurrentLanguage(),
    readWebhookSettings(),
  ]);
  scheduleWebhookDelivery();
  return <ConnectionsContent language={language} webhook={webhook} />;
}
