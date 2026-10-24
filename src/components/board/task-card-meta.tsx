'use client';

import { useDateFormatter } from '@react-aria/i18n';
import type { BoardTask, PropertyDefinition } from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface TaskCardMetaProps {
  task: BoardTask;
  properties: PropertyDefinition[];
}

/** Shows the configured assignee and one relevant date; full custom data lives in details. */
export function TaskCardMeta({ task, properties }: TaskCardMetaProps) {
  const { t } = useI18n();
  const formatter = useDateFormatter({
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const assignee = properties.find((property) =>
    ['responsable', 'assignee'].includes(property.name.toLowerCase().trim()),
  );
  const value = task.propertyValues.find(
    (entry) => entry.propertyId === assignee?.id,
  )?.value;
  const name = Array.isArray(value) ? value.join(', ') : value;
  const date = task.completedAt ?? task.dueDate;
  const overdue =
    !task.completedAt &&
    task.dueDate &&
    task.dueDate.slice(0, 10) < new Date().toISOString().slice(0, 10);
  if (!name && !date) return null;
  return (
    <div className="task-card-meta">
      {name ? (
        <span className="min-w-0 [overflow-wrap:anywhere]">
          {assignee?.name}: {name}
        </span>
      ) : null}
      {date ? (
        <span className={overdue ? 'text-danger' : ''}>
          {overdue ? `${t('task.overdue')} · ` : ''}
          {task.completedAt ? (
            <>
              <span>{t('task.completedAt')}</span> ·{' '}
            </>
          ) : null}
          <time dateTime={date}>{formatter.format(new Date(date))}</time>
        </span>
      ) : null}
    </div>
  );
}
