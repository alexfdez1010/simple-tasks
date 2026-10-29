import { scheduleWebhookDelivery } from '@/lib/webhooks/schedule';
import { requireAuthenticated } from '@/lib/auth/session';
import {
  getWorkspaceSnapshot,
  serializeWorkspace,
} from '@/lib/coordination/snapshot';
import { DependencyWorkspace } from '@/components/workspace/workspace';
import '@/components/workspace/workspace.css';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Loads the authenticated dependency graph with persisted projects and mandatory responsible parties. */
export default async function Home() {
  await requireAuthenticated();
  const snapshot = await getWorkspaceSnapshot();
  scheduleWebhookDelivery();
  return <DependencyWorkspace initial={serializeWorkspace(snapshot)} />;
}
