'use client';

import { Button } from '@heroui/react';
import { useState, type CSSProperties } from 'react';
import type { WorkspaceTask } from '@/lib/coordination/snapshot';
import { Markdown } from '@/components/board/markdown';
import { ConfirmationDialog } from '@/components/board/confirmation-dialog';
import { ReviewControls } from '@/components/workspace/review-controls';
import { WorkspaceIcon } from '@/components/workspace/workspace-icons';
import { useWorkspaceCopy } from '@/components/workspace/copy';
import { useI18n } from '@/lib/i18n/provider';
import { deleteTaskAction } from '@/lib/tasks/actions';

/**
 * Presents localized task context and optional review without blocking graph interaction.
 * @param props - Current task and callbacks for save, prerequisite navigation and protected editing.
 * @returns Read-only sections and explicit actions; deletion requires confirmation and preserves failures.
 */
export function TaskInspection({
  task,
  onSaved,
  onSelect,
  onEdit,
}: {
  task: WorkspaceTask;
  onSaved: () => void;
  onSelect: (id: string) => void;
  onEdit: () => void;
}) {
  const copy = useWorkspaceCopy();
  const { locale } = useI18n();
  const [error, setError] = useState<string | null>(null);
  /** Deletes only after confirmation; reference failures leave context and the recoverable error visible. */
  async function remove() {
    const result = await deleteTaskAction(task.id);
    if (result.success) {
      onSaved();
      return true;
    }
    setError(result.error);
    return false;
  }
  return (
    <div className="workspace-detail-fields">
      <dl className="inspection-metadata">
        <div>
          <dt>{copy.assignee}</dt>
          <dd className="inspection-owner">
            <span
              className="inspection-avatar"
              style={
                { '--assignee-color': task.assignee.color } as CSSProperties
              }
              aria-hidden="true"
            >
              {task.assignee.name.slice(0, 1).toLocaleUpperCase(locale)}
            </span>
            <span>{task.assignee.name}</span>
          </dd>
        </div>
        <div>
          <dt>{copy.status}</dt>
          <dd className="inspection-status" data-ready={task.ready}>
            <span className="graph-state-dot" aria-hidden="true" />
            {task.status.name}
          </dd>
        </div>
        <div>
          <dt>{copy.project}</dt>
          <dd>{task.project.name}</dd>
        </div>
        {task.dueDate ? (
          <div>
            <dt>{copy.dueDate}</dt>
            <dd>
              <time dateTime={task.dueDate}>
                {new Date(task.dueDate).toLocaleDateString(locale, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </time>
            </dd>
          </div>
        ) : null}
      </dl>
      <ReviewControls task={task} onSaved={onSaved} />
      <section className="inspection-section">
        <h3>{copy.description}</h3>
        <Markdown isPreview>{task.description ?? ''}</Markdown>
      </section>
      <section className="inspection-section">
        <h3>{copy.dependsOn}</h3>
        {task.prerequisites.length ? (
          <div className="inspection-dependencies">
            {task.prerequisites.map((parent) => (
              <Button
                key={parent.id}
                variant="ghost"
                className="workspace-dependency"
                onPress={() => onSelect(parent.id)}
              >
                <WorkspaceIcon
                  name={parent.status.isTerminal ? 'check' : 'connections'}
                  className="size-4 shrink-0"
                />
                <span className="inspection-dependency-label">
                  <span>{parent.title}</span>
                  <span className="text-xs text-muted">
                    {parent.status.name}
                  </span>
                </span>
                <WorkspaceIcon
                  name="chevron"
                  className="size-4 shrink-0 text-muted"
                />
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">{copy.noDependencies}</p>
        )}
      </section>
      <p className="inspection-updated">
        {copy.updated}
        <time dateTime={task.updatedAt}>
          {new Date(task.updatedAt).toLocaleString(locale)}
        </time>
      </p>
      <div className="inspection-actions">
        <Button variant="secondary" onPress={onEdit}>
          {copy.edit}
          <WorkspaceIcon name="arrow" className="size-4" />
        </Button>
        <ConfirmationDialog
          error={error}
          heading={copy.remove}
          body={task.title}
          triggerLabel={copy.remove}
          triggerVariant="ghost"
          confirmLabel={copy.remove}
          onConfirm={remove}
        />
      </div>
    </div>
  );
}
