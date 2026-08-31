'use client';

import { Button } from '@heroui/react';
import { useState } from 'react';

import { AutomationForm } from '@/components/board/automation-form';
import { ConfirmationDialog } from '@/components/board/confirmation-dialog';
import type {
  AutomationDefinition,
  AutomationValues,
  BoardStatus,
  MutationResult,
  PropertyDefinition,
} from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface AutomationSettingsProps {
  automations: AutomationDefinition[];
  statuses: BoardStatus[];
  properties: PropertyDefinition[];
  onCreate: (values: AutomationValues) => Promise<MutationResult>;
  onUpdate: (id: string, values: AutomationValues) => Promise<MutationResult>;
  onDelete: (id: string) => Promise<MutationResult>;
}

/** Returns a sensible initial rule, prioritising the first terminal status. */
function emptyValues(statuses: BoardStatus[]): AutomationValues {
  return {
    name: '',
    triggerStatusId:
      statuses.find((status) => status.isTerminal)?.id ?? statuses[0]?.id ?? '',
    actionType: 'SET_COMPLETION_DATE_TODAY',
    propertyId: null,
    propertyValue: null,
  };
}

/** Formats the configured property action without exposing JSON internals. */
function formatActionValue(
  value: AutomationDefinition['propertyValue'],
): string {
  if (value === null) return '';
  return ` = ${Array.isArray(value) ? value.join(', ') : value}`;
}

/** Renders the automation rules manager inside board settings. */
export function AutomationSettings({
  automations,
  statuses,
  properties,
  onCreate,
  onUpdate,
  onDelete,
}: AutomationSettingsProps) {
  const { t } = useI18n();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  /** Creates a rule and returns to the compact rule list on success. */
  async function create(values: AutomationValues) {
    const result = await onCreate(values);
    if (result.success) setIsCreating(false);
    return result;
  }

  /** Updates a rule and closes its inline editor on success. */
  async function update(id: string, values: AutomationValues) {
    const result = await onUpdate(id, values);
    if (result.success) setEditingId(null);
    return result;
  }

  return (
    <section
      className="flex flex-col gap-4"
      aria-labelledby="automations-heading"
    >
      <div>
        <h2 id="automations-heading" className="font-semibold">
          {t('automation.title')}
        </h2>
        <p className="text-sm text-muted">{t('automation.description')}</p>
      </div>
      {automations.length === 0 ? (
        <p className="rounded-xl border border-dashed border-divider p-4 text-sm text-muted">
          {t('automation.empty')}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {automations.map((automation) => {
            const status = statuses.find(
              (item) => item.id === automation.triggerStatusId,
            );
            const property = properties.find(
              (item) => item.id === automation.propertyId,
            );
            const initialValues: AutomationValues = { ...automation };
            return editingId === automation.id ? (
              <div
                className="rounded-2xl bg-surface-secondary p-4"
                key={automation.id}
              >
                <AutomationForm
                  statuses={statuses}
                  properties={properties}
                  initialValues={initialValues}
                  submitLabel={t('common.save')}
                  onCancel={() => setEditingId(null)}
                  onSave={(values) => update(automation.id, values)}
                />
              </div>
            ) : (
              <article
                className="flex items-start gap-3 rounded-2xl bg-surface-secondary p-4"
                key={automation.id}
              >
                <span
                  className="mt-1 size-2 shrink-0 rounded-full bg-accent"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium">{automation.name}</h3>
                  <p className="mt-1 text-sm leading-5 text-muted">
                    {t('automation.rule', {
                      status: status?.name ?? t('automation.unknownStatus'),
                      action:
                        automation.actionType === 'SET_COMPLETION_DATE_TODAY'
                          ? t('automation.actionCompletion')
                          : t('automation.actionProperty'),
                      property: property ? ` · ${property.name}` : '',
                      value: formatActionValue(automation.propertyValue),
                    })}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => setEditingId(automation.id)}
                  >
                    {t('common.edit')}
                  </Button>
                  <ConfirmationDialog
                    body={t('automation.deleteBody')}
                    confirmLabel={t('common.delete')}
                    heading={t('automation.deleteHeading', {
                      name: automation.name,
                    })}
                    triggerLabel={t('common.delete')}
                    onConfirm={async () =>
                      (await onDelete(automation.id)).success
                    }
                  />
                </div>
              </article>
            );
          })}
        </div>
      )}
      {isCreating ? (
        <div className="rounded-2xl border border-divider bg-surface-secondary p-4">
          <AutomationForm
            statuses={statuses}
            properties={properties}
            initialValues={emptyValues(statuses)}
            submitLabel={t('automation.create')}
            onCancel={() => setIsCreating(false)}
            onSave={create}
          />
        </div>
      ) : (
        <Button variant="secondary" onPress={() => setIsCreating(true)}>
          {t('automation.add')}
        </Button>
      )}
    </section>
  );
}
