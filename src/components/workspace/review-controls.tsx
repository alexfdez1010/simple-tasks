'use client';

import { Button, Label, TextArea, TextField } from '@heroui/react';
import { useState } from 'react';
import type { WorkspaceTask } from '@/lib/coordination/snapshot';
import {
  submitReviewAction,
  decideReviewAction,
} from '@/lib/coordination/review-actions';
import { useWorkspaceCopy } from '@/components/workspace/copy';

/** Offers optional review actions without changing the task's original responsible party. */
export function ReviewControls({
  task,
  onSaved,
}: {
  task: WorkspaceTask;
  onSaved: () => void;
}) {
  const copy = useWorkspaceCopy();
  const [note, setNote] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version] = useState(task.updatedAt);
  const stale = version !== task.updatedAt;
  /** Performs a version-checked review action and preserves feedback on a rejected request. */
  async function act(decision?: 'APPROVE' | 'REQUEST_CHANGES') {
    setPending(true);
    setError(null);
    try {
      const result = decision
        ? await decideReviewAction({
            id: task.id,
            reviewerId: task.reviewerId!,
            expectedUpdatedAt: version,
            decision,
            note,
          })
        : await submitReviewAction({
            id: task.id,
            assigneeId: task.assigneeId,
          });
      if (result.success) onSaved();
      else setError(result.error);
    } catch {
      setError(copy.saveFailed);
    } finally {
      setPending(false);
    }
  }
  if (!task.reviewer) return null;
  return (
    <section className="flex flex-col gap-3">
      <p className="text-sm">
        <span className="text-muted">{copy.reviewer}: </span>
        {task.reviewer.name}
      </p>
      {task.reviewNote ? (
        <p className="whitespace-pre-wrap text-sm">{task.reviewNote}</p>
      ) : null}
      {task.reviewState === 'PENDING' ? (
        <>
          <TextField value={note} onChange={setNote}>
            <Label>{copy.reviewNote}</Label>
            <TextArea rows={3} maxLength={20_000} />
          </TextField>
          {stale ? (
            <p role="status" className="text-sm text-danger">
              {copy.changed}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              isPending={pending}
              isDisabled={stale}
              onPress={() => void act('APPROVE')}
            >
              {copy.approve}
            </Button>
            <Button
              variant="secondary"
              isDisabled={pending || stale || !note.trim()}
              onPress={() => void act('REQUEST_CHANGES')}
            >
              {copy.requestChanges}
            </Button>
          </div>
        </>
      ) : task.status.isTerminal ? (
        <span className="text-xs text-muted">{copy.reviewApproved}</span>
      ) : (
        <Button
          variant="secondary"
          isPending={pending}
          isDisabled={task.blockingDependencyIds.length > 0}
          onPress={() => void act()}
        >
          {copy.submitReview}
        </Button>
      )}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}
