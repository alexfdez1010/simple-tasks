'use client';

import { Checkbox, Input, TextField } from '@heroui/react';
import { useState } from 'react';
import type { WorkspaceTask } from '@/lib/coordination/snapshot';
import { useWorkspaceCopy } from '@/components/workspace/copy';

/** Selects real prerequisite IDs without allowing self-dependencies or replacing existing checked choices on search. */
export function DependencyPicker({
  tasks,
  taskId,
  selected,
  onChange,
}: {
  tasks: WorkspaceTask[];
  taskId?: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState('');
  const copy = useWorkspaceCopy();
  const candidates = tasks.filter(
    (task) =>
      task.id !== taskId &&
      (selected.includes(task.id) ||
        task.title.toLocaleLowerCase().includes(query.toLocaleLowerCase())),
  );
  return (
    <section>
      <h3 className="mb-3 text-sm font-medium">{copy.dependsOn}</h3>
      <TextField
        aria-label={copy.dependencySearch}
        value={query}
        onChange={setQuery}
      >
        <Input placeholder={copy.dependencySearch} />
      </TextField>
      <div className="mt-3 flex max-h-48 flex-col gap-3 overflow-y-auto">
        {candidates.map((task) => (
          <Checkbox
            key={task.id}
            isSelected={selected.includes(task.id)}
            onChange={(checked) =>
              onChange(
                checked
                  ? [...selected, task.id]
                  : selected.filter((id) => id !== task.id),
              )
            }
          >
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <span className="text-sm">
                {task.title}
                <span className="ml-2 text-xs text-muted">
                  {task.assignee.name}
                </span>
              </span>
            </Checkbox.Content>
          </Checkbox>
        ))}
      </div>
    </section>
  );
}
