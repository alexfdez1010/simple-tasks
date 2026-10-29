'use client';

import { Button, Input, Label, TextArea, TextField } from '@heroui/react';
import { useEffect } from 'react';
import {
  pendingDependencies,
  type PreviewTask,
} from '@/components/coordination-preview/data';
import { WorkspaceIcon } from '@/components/workspace/workspace-icons';

/** Edits a disposable task locally and keeps prerequisites navigable without server actions. */
export function PreviewInspector({
  task,
  tasks,
  onUpdate,
  onSelect,
  onClose,
}: {
  task: PreviewTask;
  tasks: PreviewTask[];
  onUpdate: (task: PreviewTask) => void;
  onSelect: (id: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    document.getElementById('preview-task-heading')?.focus();
    /** Returns Escape to the preview without consuming other keys or changing tasks. */
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [task.id, onClose]);
  return (
    <aside className="workspace-detail" aria-label="Detalle de tarea">
      <header className="workspace-detail-header">
        <h2 id="preview-task-heading" tabIndex={-1}>
          {task.title}
        </h2>
        <Button
          variant="ghost"
          isIconOnly
          aria-label="Cerrar detalle"
          onPress={onClose}
        >
          <WorkspaceIcon name="close" />
        </Button>
      </header>
      <div className="workspace-detail-fields">
        <div>
          <span className="text-xs text-muted">Responsable</span>
          <p className="mt-1 text-sm">{task.owner}</p>
        </div>
        <TextField
          value={task.title}
          onChange={(title) => onUpdate({ ...task, title })}
        >
          <Label>Título</Label>
          <Input />
        </TextField>
        <TextField
          value={task.description}
          onChange={(description) => onUpdate({ ...task, description })}
        >
          <Label>Descripción</Label>
          <TextArea rows={5} />
        </TextField>
        <section>
          <h3 className="mb-2 text-xs text-muted">Depende de</h3>
          {task.dependencies.length ? (
            task.dependencies.map((id) => {
              const prerequisite = tasks.find(
                (candidate) => candidate.id === id,
              );
              return prerequisite ? (
                <Button
                  key={id}
                  variant="ghost"
                  className="h-auto w-full justify-between gap-3 whitespace-normal py-3 text-left text-sm"
                  onPress={() => onSelect(id)}
                >
                  {prerequisite.title}
                  <span className="text-xs text-muted">
                    {prerequisite.state === 'done' ? 'Terminada' : 'Pendiente'}
                  </span>
                </Button>
              ) : null;
            })
          ) : (
            <p className="text-sm">Sin dependencias</p>
          )}
        </section>
        <Button
          isDisabled={
            Boolean(pendingDependencies(task, tasks).length) &&
            task.state !== 'done'
          }
          onPress={() =>
            onUpdate({
              ...task,
              state: task.state === 'done' ? 'todo' : 'done',
            })
          }
        >
          {task.state === 'done' ? 'Reabrir' : 'Completar'}
        </Button>
      </div>
    </aside>
  );
}
