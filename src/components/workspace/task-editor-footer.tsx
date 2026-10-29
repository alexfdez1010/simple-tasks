'use client';
import { Button } from '@heroui/react';
import { useWorkspaceCopy } from '@/components/workspace/copy';

/** Keeps validation feedback and submit/cancel actions consistent without owning the task draft. */
export function TaskEditorFooter({
  pending,
  disabled,
  warning,
  error,
  onCancel,
}: {
  pending: boolean;
  disabled: boolean;
  warning: string | null;
  error: string | null;
  onCancel: () => void;
}) {
  const copy = useWorkspaceCopy();
  return (
    <>
      {warning ? (
        <p role="status" className="text-sm text-danger">
          {warning}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onPress={onCancel} isDisabled={pending}>
          {copy.cancel}
        </Button>
        <Button type="submit" isPending={pending} isDisabled={disabled}>
          {copy.save}
        </Button>
      </div>
    </>
  );
}
