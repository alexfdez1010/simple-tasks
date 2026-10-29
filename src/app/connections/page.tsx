import { ConnectionsContent } from '@/components/connections/connections-content';
import { requireAuthenticated } from '@/lib/auth/session';
import { getCurrentLanguage } from '@/lib/i18n/server';

/** Renders the protected integration entry point; credentials remain on their setup pages. */
export default async function ConnectionsPage() {
  await requireAuthenticated();
  return <ConnectionsContent language={await getCurrentLanguage()} />;
}
