import type { Metadata } from 'next';

import { AutomationWorkspace } from '@/components/automations/automation-workspace';
import type { AutomationStatus } from '@/components/automations/types';
import { getAutomationSnapshot } from '@/lib/automations/queries';
import { getCurrentLanguage } from '@/lib/i18n/server';
import { translate } from '@/lib/i18n/translations';

/** Ensures the rule workspace always reads current execution state. */
export const dynamic = 'force-dynamic';

/** Builds localized metadata for the automation workspace. */
export async function generateMetadata(): Promise<Metadata> {
  const language = await getCurrentLanguage();
  return {
    title: `${translate(language, 'automation.title')} · ${translate(language, 'board.title')}`,
    description: translate(language, 'automation.description'),
  };
}

/** Loads and renders the authenticated automation workspace. */
export default async function AutomationsPage(): Promise<React.JSX.Element> {
  const snapshot = await getAutomationSnapshot();
  const statuses: AutomationStatus[] = snapshot.statuses.map((status) => ({
    id: status.id,
    name: status.name,
    color: status.color,
    position: status.position,
    isTerminal: status.isTerminal,
  }));

  return (
    <AutomationWorkspace
      initialAutomations={snapshot.automations}
      properties={snapshot.properties}
      statuses={statuses}
    />
  );
}
