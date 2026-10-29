'use client';

import { Button } from '@heroui/react';
import { useCallback, useState } from 'react';
import {
  PREVIEW_TASKS,
  pendingDependencies,
  previewState,
  type PreviewTask,
} from '@/components/coordination-preview/data';
import { PreviewInspector } from '@/components/coordination-preview/preview-inspector';
import { TaskGraph } from '@/components/workspace/task-graph';
import { WorkspaceNavigation } from '@/components/workspace/workspace-navigation';
import { WorkspaceHeader } from '@/components/workspace/workspace-header';
import { WorkspaceIcon } from '@/components/workspace/workspace-icons';

const projects = [{ id: 'invites', name: 'Acceso por invitación' }];

/** Demonstrates the production shell and graph using explicitly labelled, entirely local example tasks. */
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
  /** Replaces an example record in memory; no database or server action participates. */
  function updateTask(task: PreviewTask) {
    setTasks((previous) =>
      previous.map((candidate) =>
        candidate.id === task.id ? task : candidate,
      ),
    );
  }
  /** Adds a local example task and opens its editable inspector. */
  function createTask() {
    const id = Math.max(100, ...tasks.map((task) => task.id)) + 1;
    setTasks((previous) => [
      ...previous,
      {
        id,
        title: 'Nueva tarea de ejemplo',
        description: '',
        owner: 'Alejandro',
        state: 'todo',
        dependencies: [],
      },
    ]);
    setSelected(id);
  }
  /** Restores the exact synthetic baseline and dismisses local editing. */
  function reset() {
    setTasks(PREVIEW_TASKS);
    setSelected(null);
    setProject('all');
  }
  /** Dismisses local editing and restores keyboard focus to its task or the creation action. */
  const close = useCallback(() => {
    setSelected(null);
    requestAnimationFrame(() =>
      (
        document.getElementById(`task-node-${selected}`) ??
        document.getElementById('new-task')
      )?.focus(),
    );
  }, [selected]);
  return (
    <div className="workspace">
      <a href="#dependency-workspace" className="skip-link">
        Dependencias de tareas
      </a>
      <WorkspaceNavigation
        projects={projects}
        tasks={graphTasks.map((task) => ({
          projectId: task.projectId,
          status: { isTerminal: task.completed },
        }))}
        projectId={project}
        onProjectChange={setProject}
      >
        <Button variant="ghost" onPress={reset}>
          <WorkspaceIcon name="refresh" />
          Restablecer
        </Button>
      </WorkspaceNavigation>
      <div className="workspace-main">
        <WorkspaceHeader
          projectId={project}
          projects={projects}
          count={tasks.length}
          ready={graphTasks.filter((task) => task.ready).length}
          onProjectChange={setProject}
          onCreate={createTask}
        />
        <p className="workspace-demo">
          Datos de ejemplo. Los cambios no afectan a tus tareas.
        </p>
        <main
          id="dependency-workspace"
          className="workspace-content"
          data-inspecting={selected !== null}
          tabIndex={-1}
        >
          <TaskGraph
            tasks={graphTasks}
            projects={projects}
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
            <PreviewInspector
              task={current}
              tasks={tasks}
              onUpdate={updateTask}
              onSelect={setSelected}
              onClose={close}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
