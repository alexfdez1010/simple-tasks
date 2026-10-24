'use client';

import { Button, Input, Label, TextField } from '@heroui/react';
import { useRef, useState } from 'react';
import { TaskDialog } from '@/components/board/task-dialog';
import type {
  BoardStatus,
  MutationResult,
  PropertyDefinition,
  TaskValues,
} from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface QuickTaskCreateProps {
  status: BoardStatus;
  properties: PropertyDefinition[];
  onCreate: (values: TaskValues) => Promise<MutationResult>;
  onClose: () => void;
}

/** Captures a title in its column; failures and promotion to details preserve the draft. */
export function QuickTaskCreate({
  status,
  properties,
  onCreate,
  onClose,
}: QuickTaskCreateProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);

  /** Saves once per submission; only successful persistence discards the local draft. */
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    if (!title.trim()) {
      setError(t('task.enterTitle'));
      return;
    }
    submitting.current = true;
    setPending(true);
    setError('');
    try {
      const result = await onCreate({
        title: title.trim(),
        description: '',
        dueDate: '',
        statusId: status.id,
        propertyValues: [],
      });
      if (result.success) onClose();
      else setError(result.error ?? t('task.retry'));
    } catch {
      setError(t('task.retry'));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <div className="quick-task-create">
      <form
        onSubmit={create}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && !pending) {
            event.preventDefault();
            onClose();
          }
        }}
      >
        <TextField
          isRequired
          isDisabled={pending}
          value={title}
          onChange={setTitle}
        >
          <Label>{t('task.title')}</Label>
          <Input autoFocus maxLength={160} placeholder={t('task.quickTitle')} />
        </TextField>
        {error ? (
          <p className="mt-2 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-1">
          <Button
            className="min-h-11"
            type="submit"
            size="sm"
            isPending={pending}
          >
            {t('task.create')}
          </Button>
          <Button
            className="min-h-11"
            size="sm"
            variant="ghost"
            isDisabled={pending}
            onPress={onClose}
          >
            {t('common.cancel')}
          </Button>
        </div>
      </form>
      <TaskDialog
        defaultStatusId={status.id}
        createContext={status.name}
        initialTitle={title}
        properties={properties}
        onSave={onCreate}
        onCreated={onClose}
        trigger={
          <Button
            className="mt-1 min-h-11"
            size="sm"
            variant="ghost"
            isDisabled={pending}
          >
            {t('task.addDetails')}
          </Button>
        }
      />
    </div>
  );
}
