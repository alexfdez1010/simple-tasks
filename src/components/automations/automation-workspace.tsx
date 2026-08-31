'use client';
import { Button, Link } from '@heroui/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import appIcon from '@/app/icon.png';
import {
  automationToDraft,
  createAutomationDraft,
} from '@/components/automations/automation-draft';
import { AutomationEditor } from '@/components/automations/automation-editor';
import {
  AddRuleIcon,
  BackIcon,
  RuleIcon,
} from '@/components/automations/automation-icons';
import { AutomationMetrics } from '@/components/automations/automation-metrics';
import { AutomationRuleList } from '@/components/automations/automation-rule-list';
import type {
  AutomationDefinition,
  AutomationStatus,
  AutomationValues,
  PropertyDefinition,
} from '@/components/automations/types';
import { useAutomationMutations } from '@/components/automations/use-automation-mutations';
import { AutomationWelcome } from '@/components/automations/automation-welcome';
import { useServerReconciledState } from '@/components/board/use-server-reconciled-state';
import { useI18n } from '@/lib/i18n/provider';

interface AutomationWorkspaceProps {
  initialAutomations: AutomationDefinition[];
  properties: PropertyDefinition[];
  statuses: AutomationStatus[];
}

/** Owns dedicated automation selection, editing, and persistence state. */
export function AutomationWorkspace({
  initialAutomations,
  properties,
  statuses,
}: AutomationWorkspaceProps): React.JSX.Element {
  const router = useRouter();
  const { t } = useI18n();
  const [automations, setAutomations] =
    useServerReconciledState(initialAutomations);
  const [editorMode, setEditorMode] = useState<'idle' | 'create' | 'edit'>(
    'idle',
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const mutations = useAutomationMutations({
    setAutomations,
    refresh: router.refresh,
  });
  const editingAutomation = automations.find(
    (automation) => automation.id === editingId,
  );

  /** Opens a clean automation draft. */
  function startCreating(): void {
    setEditingId(null);
    setEditorMode('create');
  }

  /** Opens one persisted automation in the editor. */
  function startEditing(id: string): void {
    setEditingId(id);
    setEditorMode('edit');
  }

  /** Returns to the rule overview without mutating persisted state. */
  function closeEditor(): void {
    setEditingId(null);
    setEditorMode('idle');
  }

  /** Creates a rule and returns to the refreshed rule list on success. */
  async function create(values: AutomationValues) {
    const result = await mutations.create(values);
    if (result.success) closeEditor();
    return result;
  }

  /** Updates the selected rule and returns to the overview on success. */
  async function update(values: AutomationValues) {
    if (!editingId)
      return { success: false, error: t('automation.saveFallback') };
    const result = await mutations.update(editingId, values);
    if (result.success) closeEditor();
    return result;
  }

  /** Deletes a rule and clears the editor when it owned the deleted rule. */
  async function remove(id: string): Promise<boolean> {
    const result = await mutations.remove(id);
    if (result.success && editingId === id) closeEditor();
    return result.success;
  }

  const initialValues = editingAutomation
    ? automationToDraft(editingAutomation)
    : createAutomationDraft(statuses);
  const isEditing = editorMode === 'edit' && Boolean(editingAutomation);
  const isEditorOpen = editorMode !== 'idle';

  return (
    <div className="automation-app min-h-dvh bg-background text-foreground">
      <a className="skip-link" href="#automation-content">
        {t('automation.skipToRules')}
      </a>
      <header className="automation-topbar">
        <div className="automation-topbar-inner">
          <Link className="automation-back-link" href="/">
            <BackIcon className="size-4" />
            {t('automation.backToBoard')}
          </Link>
          <div className="automation-brand">
            <span className="automation-brand-mark" aria-hidden="true">
              <Image alt="" priority sizes="40px" src={appIcon} />
            </span>
            <span>{t('board.title')}</span>
            <span aria-hidden="true">/</span>
            <strong>{t('automation.title')}</strong>
          </div>
        </div>
      </header>

      <main id="automation-content" className="automation-main">
        <section
          className="automation-hero"
          aria-labelledby="automation-heading"
        >
          <div>
            <span className="automation-hero-icon" aria-hidden="true">
              <RuleIcon className="size-6" />
            </span>
            <h1 id="automation-heading">{t('automation.title')}</h1>
            <p>{t('automation.pageDescription')}</p>
          </div>
          <Button isDisabled={isEditorOpen} onPress={startCreating}>
            <AddRuleIcon className="size-4" />
            {t('automation.newRule')}
          </Button>
        </section>

        <AutomationMetrics automations={automations} />

        <div className="automation-workspace" data-editor-open={isEditorOpen}>
          <aside
            className="automation-rule-rail"
            aria-label={t('automation.ruleList')}
            inert={isEditorOpen ? true : undefined}
          >
            <AutomationRuleList
              automations={automations}
              editingId={editingId}
              properties={properties}
              statuses={statuses}
              onCreate={startCreating}
              onDelete={remove}
              onEdit={startEditing}
            />
          </aside>
          <section
            className="automation-editor-pane"
            aria-label={t('automation.editor')}
          >
            {isEditorOpen ? (
              <AutomationEditor
                key={editingId ?? 'new'}
                initialValues={initialValues}
                isEditing={isEditing}
                properties={properties}
                statuses={statuses}
                onCancel={closeEditor}
                onSave={isEditing ? update : create}
              />
            ) : (
              <AutomationWelcome onCreate={startCreating} />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
