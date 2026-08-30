'use client';

import { Button } from '@heroui/react';
import { useState } from 'react';

import { StatusForm } from '@/components/board/status-form';
import { StatusRow } from '@/components/board/status-row';
import type {
  BoardStatus,
  MutationResult,
  StatusValues,
} from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface StatusSettingsProps {
  statuses: BoardStatus[];
  onCreate: (values: StatusValues) => Promise<MutationResult>;
  onUpdate: (statusId: string, values: StatusValues) => Promise<MutationResult>;
  onDelete: (statusId: string) => Promise<MutationResult>;
  onReorder: (statusId: string, direction: -1 | 1) => Promise<MutationResult>;
}

const NEW_STATUS_VALUES: StatusValues = {
  name: '',
  color: '#6B7280',
  isTerminal: false,
};

/**
 * Renders the workflow-state manager used inside board settings.
 *
 * @param props - Current states and their mutation callbacks.
 * @returns The ordered state list and its creation form.
 */
export function StatusSettings({
  statuses,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
}: StatusSettingsProps) {
  const { t } = useI18n();
  const [isCreating, setIsCreating] = useState(false);

  /** Creates a state and closes the form after successful persistence. */
  async function handleCreate(values: StatusValues) {
    const result = await onCreate(values);
    if (result.success) setIsCreating(false);
    return result;
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="statuses-heading">
      <div>
        <h2 id="statuses-heading" className="font-semibold">
          {t('status.title')}
        </h2>
        <p className="text-sm text-muted">{t('status.orderDescription')}</p>
      </div>
      <div className="flex flex-col gap-3">
        {statuses.map((status, index) => (
          <StatusRow
            key={status.id}
            status={status}
            isFirst={index === 0}
            isLast={index === statuses.length - 1}
            onSave={(values) => onUpdate(status.id, values)}
            onDelete={() => onDelete(status.id)}
            onReorder={(direction) => onReorder(status.id, direction)}
          />
        ))}
      </div>
      {isCreating ? (
        <div className="rounded-2xl border border-divider bg-surface-secondary p-4">
          <StatusForm
            initialValues={NEW_STATUS_VALUES}
            submitLabel={t('status.create')}
            onCancel={() => setIsCreating(false)}
            onSave={handleCreate}
          />
        </div>
      ) : (
        <Button variant="secondary" onPress={() => setIsCreating(true)}>
          {t('status.add')}
        </Button>
      )}
    </section>
  );
}
