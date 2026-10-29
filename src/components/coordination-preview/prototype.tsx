'use client';

import { Button, Label, TextArea, TextField } from '@heroui/react';
import { useState } from 'react';
import {
  PREVIEW_TASKS,
  pendingDependencies,
  previewState,
  type PreviewTask,
} from '@/components/coordination-preview/data';
import { TaskGraph } from '@/components/workspace/task-graph';
import { StatisticSelect } from '@/components/statistics/statistic-select';

/** Demonstrates the user's selected minimalist graph direction with disposable tasks and actual edges. */
export function CoordinationPrototype() {
  const [tasks, setTasks] = useState(PREVIEW_TASKS);
  const [selected, setSelected] = useState<number | null>(null);
  const [project, setProject] = useState('all');
  const current = tasks.find((task) => task.id === selected);
  const graphTasks = tasks.map((task) => ({
    id: String(task.id),
    title: task.title,
    assignee: task.owner,
    color:
      task.owner === 'Alejandro'
        ? '#C3986A'
        : task.owner === 'Agente de desarrollo'
          ? '#7297CA'
          : '#8BAF91',
    projectId: 'invites',
    status: previewState(task, tasks),
    completed: task.state === 'done',
    ready: task.state === 'todo' && !pendingDependencies(task, tasks).length,
    dependencyIds: task.dependencies.map(String),
  }));
  /** Replaces an example record without persisting any database changes. */
  function updateTask(task: PreviewTask) {
    setTasks((previous) =>
      previous.map((candidate) =>
        candidate.id === task.id ? task : candidate,
      ),
    );
  }
  return (
    <div className="workspace">
      <header className="workspace-header">
        <span className="workspace-brand">Tasks</span>
        <div className="w-52">
          <StatisticSelect
            label="Proyecto"
            value={project}
            onChange={setProject}
            options={[
              { id: 'all', label: 'Todos los proyectos' },
              { id: 'invites', label: 'Acceso por invitación' },
            ]}
          />
        </div>
        <span className="ml-auto text-xs text-muted">Ejemplo interactivo</span>
        <Button
          variant="ghost"
          onPress={() => {
            setTasks(PREVIEW_TASKS);
            setSelected(null);
          }}
        >
          Restablecer
        </Button>
      </header>
      <main className="workspace-content">
        <TaskGraph
          tasks={graphTasks}
          projects={[{ id: 'invites', name: 'Acceso por invitación' }]}
          scope={project}
          selectedId={selected === null ? null : String(selected)}
          onSelect={(id) => setSelected(Number(id))}
          labels={{
            graph: 'Dependencias de tareas',
            zoomIn: 'Acercar',
            zoomOut: 'Alejar',
            fit: 'Encajar',
            empty: 'No hay tareas en este proyecto.',
          }}
        />
        {current ? (
          <aside className="workspace-detail" aria-label="Detalle de tarea">
            <header className="workspace-detail-header">
              <h2>{current.title}</h2>
              <Button
                variant="ghost"
                isIconOnly
                aria-label="Cerrar detalle"
                onPress={() => setSelected(null)}
              >
                ×
              </Button>
            </header>
            <div className="workspace-detail-fields">
              <div>
                <span className="text-xs text-muted">Responsable</span>
                <p className="mt-1 text-sm">{current.owner}</p>
              </div>
              <TextField
                value={current.description}
                onChange={(description) =>
                  updateTask({ ...current, description })
                }
              >
                <Label>Descripción</Label>
                <TextArea rows={5} />
              </TextField>
              <section>
                <h3 className="mb-2 text-xs text-muted">Depende de</h3>
                {current.dependencies.length ? (
                  current.dependencies.map((id) => {
                    const prerequisite = tasks.find((task) => task.id === id)!;
                    return (
                      <Button
                        key={id}
                        variant="ghost"
                        className="h-auto w-full justify-between gap-3 whitespace-normal py-3 text-left text-sm"
                        onPress={() => setSelected(id)}
                      >
                        {prerequisite.title}
                        <span className="text-xs text-muted">
                          {prerequisite.state === 'done'
                            ? 'Terminada'
                            : 'Pendiente'}
                        </span>
                      </Button>
                    );
                  })
                ) : (
                  <p className="text-sm">Sin dependencias</p>
                )}
              </section>
              <Button
                isDisabled={
                  Boolean(pendingDependencies(current, tasks).length) &&
                  current.state !== 'done'
                }
                onPress={() =>
                  updateTask({
                    ...current,
                    state: current.state === 'done' ? 'todo' : 'done',
                  })
                }
              >
                {current.state === 'done' ? 'Reabrir' : 'Completar'}
              </Button>
            </div>
          </aside>
        ) : null}
      </main>
      <p className="workspace-demo">
        Datos de ejemplo. Los cambios no afectan a tus tareas.
      </p>
    </div>
  );
}
