'use client';

import { useDateFormatter } from '@react-aria/i18n';

import { Markdown } from '@/components/board/markdown';
import type {
  BoardStatus,
  BoardTask,
  PropertyDefinition,
} from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface TaskDetailProps {
  task: BoardTask;
  status?: BoardStatus;
  properties: PropertyDefinition[];
}

/** Formats a typed property value for the read-only task inspector. */
function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

/** Renders the complete, read-only task record with Markdown and metadata. */
export function TaskDetail({ task, status, properties }: TaskDetailProps) {
  const { t } = useI18n();
  const dateFormatter = useDateFormatter({
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const values = new Map(
    task.propertyValues.map((item) => [item.propertyId, item.value]),
  );
  const date = (value?: string | null) =>
    value ? dateFormatter.format(new Date(value)) : t('task.noValue');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2 text-xs text-muted">
        <span
          className="task-detail-status"
          style={{ '--status-color': status?.color } as React.CSSProperties}
        >
          {status?.name ?? task.statusId}
        </span>
        <span className="task-detail-meta">
          {t('task.created', { date: date(task.createdAt) })}
        </span>
        <span className="task-detail-meta">
          {t('task.updated', { date: date(task.updatedAt) })}
        </span>
      </div>
      <section aria-labelledby="task-description-heading">
        <h3
          id="task-description-heading"
          className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted"
        >
          {t('task.description')}
        </h3>
        <div className="task-detail-markdown rounded-2xl bg-surface-secondary p-4">
          <Markdown isPreview>{task.description ?? ''}</Markdown>
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="task-detail-field">
          <span>{t('task.dueDate')}</span>
          <strong>{date(task.dueDate)}</strong>
        </div>
        {task.completedAt ? (
          <div className="task-detail-field">
            <span>{t('task.completedAt')}</span>
            <strong>{date(task.completedAt)}</strong>
          </div>
        ) : null}
      </div>
      <section aria-labelledby="task-properties-heading">
        <h3
          id="task-properties-heading"
          className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted"
        >
          {t('property.title')}
        </h3>
        {properties.length === 0 ? (
          <p className="text-sm text-muted">{t('property.empty')}</p>
        ) : (
          <dl className="grid gap-2 sm:grid-cols-2">
            {properties.map((property) => (
              <div className="task-detail-property" key={property.id}>
                <dt>{property.name}</dt>
                <dd>
                  {formatValue(values.get(property.id) ?? t('task.noValue'))}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>
      <p className="font-mono text-[11px] text-muted">
        {t('task.identifier', { id: task.id })}
      </p>
    </div>
  );
}
