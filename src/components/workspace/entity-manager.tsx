'use client';

import { Button, Input, Label, TextArea, TextField } from '@heroui/react';
import { useState } from 'react';
import type { WorkspaceSnapshot } from '@/lib/coordination/snapshot';
import {
  createAssigneeAction,
  createProjectAction,
  updateAssigneeAction,
  updateProjectAction,
} from '@/lib/coordination/actions';
import { StatisticSelect } from '@/components/statistics/statistic-select';
import { StatusColorPicker } from '@/components/board/status-color-picker';
import { useWorkspaceCopy } from '@/components/workspace/copy';

type Entry = {
  id: string;
  name: string;
  description: string;
  kind?: 'HUMAN' | 'AGENT';
  color?: string;
};

/** Edits a responsible party or project while keeping its stable identifier and existing task links. */
function EntityForm({
  entry,
  type,
  onSaved,
  onCancel,
}: {
  entry?: Entry;
  type: 'assignee' | 'project';
  onSaved: () => void;
  onCancel: () => void;
}) {
  const copy = useWorkspaceCopy();
  const [name, setName] = useState(entry?.name ?? '');
  const [description, setDescription] = useState(entry?.description ?? '');
  const [kind, setKind] = useState<'HUMAN' | 'AGENT'>(entry?.kind ?? 'HUMAN');
  const [color, setColor] = useState(entry?.color ?? '#7297CA');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Persists a validated entity, retaining the entire form if the request fails. */
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const input = { name, description };
      const result =
        type === 'project'
          ? entry
            ? await updateProjectAction({ ...input, id: entry.id })
            : await createProjectAction(input)
          : entry
            ? await updateAssigneeAction({
                ...input,
                kind,
                color,
                id: entry.id,
              })
            : await createAssigneeAction({ ...input, kind, color });
      if (result.success) onSaved();
      else setError(result.error);
    } catch {
      setError(copy.saveFailed);
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <TextField isRequired value={name} onChange={setName}>
        <Label>{copy.name}</Label>
        <Input autoFocus maxLength={type === 'project' ? 100 : 80} />
      </TextField>
      {type === 'assignee' ? (
        <>
          <StatisticSelect
            label={copy.kind}
            value={kind}
            onChange={(value) => setKind(value as 'HUMAN' | 'AGENT')}
            options={[
              { id: 'HUMAN', label: copy.human },
              { id: 'AGENT', label: copy.agent },
            ]}
          />
          <StatusColorPicker value={color} onChange={setColor} />
        </>
      ) : null}
      <TextField value={description} onChange={setDescription}>
        <Label>{copy.instructions}</Label>
        <TextArea rows={5} maxLength={20_000} />
      </TextField>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" isDisabled={pending} onPress={onCancel}>
          {copy.cancel}
        </Button>
        <Button type="submit" isPending={pending} isDisabled={!name.trim()}>
          {copy.save}
        </Button>
      </div>
    </form>
  );
}

/** Lists database-backed entities and opens a focused form only after an explicit add/edit action. */
export function EntityManager({
  type,
  snapshot,
  onSaved,
}: {
  type: 'assignee' | 'project';
  snapshot: WorkspaceSnapshot;
  onSaved: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const copy = useWorkspaceCopy();
  const entries: Entry[] =
    type === 'assignee' ? snapshot.assignees : snapshot.projects;
  return selected ? (
    <EntityForm
      key={selected}
      entry={entries.find((entry) => entry.id === selected)}
      type={type}
      onSaved={() => {
        setSelected(null);
        onSaved();
      }}
      onCancel={() => setSelected(null)}
    />
  ) : (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center gap-3 py-2">
            {entry.color ? (
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ background: entry.color }}
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{entry.name}</p>
              {entry.kind ? (
                <p className="text-xs text-muted">
                  {entry.kind === 'AGENT' ? copy.agent : copy.human}
                </p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              onPress={() => setSelected(entry.id)}
              aria-label={`${copy.edit} ${entry.name}`}
            >
              {copy.edit}
            </Button>
          </div>
        ))}
      </div>
      <Button variant="secondary" onPress={() => setSelected('new')}>
        {type === 'assignee' ? copy.addAssignee : copy.addProject}
      </Button>
    </section>
  );
}
