'use client';

import { Button, Label, ListBox, Select } from '@heroui/react';
import { useState } from 'react';
import type { BoardStatus, MutationResult } from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface TaskMoveProps {
  statusId: string;
  statuses: BoardStatus[];
  onMove: (statusId: string) => Promise<MutationResult>;
  onMoved: () => void;
}

/** Moves a task without dragging; failure retains selection and keeps the inspector open. */
export function TaskMove({
  statusId,
  statuses,
  onMove,
  onMoved,
}: TaskMoveProps) {
  const { t } = useI18n();
  const [target, setTarget] = useState(statusId);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  /** Commits the selected state via the injected mutation, preserving server invariants. */
  async function move() {
    if (pending || target === statusId) return;
    setPending(true);
    setError('');
    try {
      const result = await onMove(target);
      if (result.success) onMoved();
      else setError(result.error ?? t('task.saveFallback'));
    } catch {
      setError(t('task.saveFallback'));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-end gap-2">
        <Select
          className="min-w-0 flex-1"
          value={target}
          isDisabled={pending}
          onChange={(value) => {
            if (value) setTarget(String(value));
          }}
        >
          <Label>{t('task.moveTo')}</Label>
          <Select.Trigger className="min-h-11">
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {statuses.map((status) => (
                <ListBox.Item
                  key={status.id}
                  id={status.id}
                  textValue={status.name}
                >
                  {status.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>
        <Button
          className="min-h-11"
          variant="secondary"
          isDisabled={target === statusId}
          isPending={pending}
          onPress={move}
        >
          {t('task.move')}
        </Button>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
