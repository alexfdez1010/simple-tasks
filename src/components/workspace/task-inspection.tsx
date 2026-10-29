'use client';
import { Button } from '@heroui/react';
import { useState } from 'react';
import type { WorkspaceTask } from '@/lib/coordination/snapshot';
import { Markdown } from '@/components/board/markdown';
import { ConfirmationDialog } from '@/components/board/confirmation-dialog';
import { ReviewControls } from '@/components/workspace/review-controls';
import { useWorkspaceCopy } from '@/components/workspace/copy';
import { deleteTaskAction } from '@/lib/tasks/actions';

/** Shows task context and optional review in a nonmodal inspector; editing remains a separate protected interaction. */
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
  const [error, setError] = useState<string | null>(null);
  /** Deletes after explicit confirmation, keeping the inspector and visible error when references prevent removal. */
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
      <div className="flex flex-wrap gap-3 text-sm">
        <span>{task.assignee.name}</span>
        <span className="text-muted">{task.status.name}</span>
      </div>
      <ReviewControls task={task} onSaved={onSaved} />
      <Markdown isPreview>{task.description ?? ''}</Markdown>
      <section>
        <h3 className="mb-3 text-sm text-muted">{copy.dependsOn}</h3>
        {task.prerequisites.length ? (
          task.prerequisites.map((parent) => (
            <Button
              key={parent.id}
              variant="ghost"
              className="h-auto w-full justify-between gap-4 whitespace-normal py-3 text-left text-sm"
              onPress={() => onSelect(parent.id)}
            >
              {parent.title}
              <span className="text-xs text-muted">{parent.status.name}</span>
            </Button>
          ))
        ) : (
          <p className="text-sm">{copy.noDependencies}</p>
        )}
      </section>
      <p className="text-xs text-muted">
        {copy.updated}: {new Date(task.updatedAt).toLocaleString()}
      </p>
      <Button variant="secondary" onPress={onEdit}>
        {copy.edit}
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
  );
}
