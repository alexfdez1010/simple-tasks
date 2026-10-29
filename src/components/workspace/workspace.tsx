'use client';

import { Button, Checkbox, Input, Link, TextField } from '@heroui/react';
import { useState } from 'react';
import type { WorkspaceSnapshot } from '@/lib/coordination/snapshot';
import { useWorkspacePolling } from '@/components/workspace/use-workspace-polling';
import { useWorkspaceCopy } from '@/components/workspace/copy';
import { TaskGraph } from '@/components/workspace/task-graph';
import { WorkspaceTaskPanel } from '@/components/workspace/task-panel';
import { WorkspaceManagement } from '@/components/workspace/management';
import { WorkspaceSettings } from '@/components/workspace/settings';
import { StatisticSelect } from '@/components/statistics/statistic-select';
import { filterGraphTasks } from '@/components/workspace/graph-filter';

/** Composes the graph-first task workspace; background snapshots never key or reset open drafts. */
export function DependencyWorkspace({
  initial,
}: {
  initial: WorkspaceSnapshot;
}) {
  const polling = useWorkspacePolling(initial);
  const { snapshot } = polling;
  const copy = useWorkspaceCopy();
  const [projectId, setProjectId] = useState('all');
  const [assigneeId, setAssigneeId] = useState('all');
  const [search, setSearch] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = filterGraphTasks(snapshot.tasks, {
    projectId,
    assigneeId,
    search,
    showCompleted,
  });
  const graphTasks = filtered.map((task) => ({
    id: task.id,
    title: task.title,
    assignee: task.assignee.name,
    color: task.assignee.color,
    reviewer: task.reviewer
      ? `${copy.reviewer}: ${task.reviewer.name}`
      : undefined,
    projectId: task.projectId,
    status: task.status.isTerminal
      ? task.status.name
      : task.blockingDependencyIds.length
        ? copy.waiting
        : task.ready
          ? copy.ready
          : task.status.name,
    completed: task.status.isTerminal,
    ready: task.ready,
    dependencyIds: task.dependencyIds,
  }));
  /** Refreshes after a successful save and closes only the completed task form. */
  function saved() {
    setSelected(null);
    void polling.refresh(true);
  }
  return (
    <div className="workspace">
      <a href="#dependency-workspace" className="skip-link">
        {copy.graph}
      </a>
      <header className="workspace-header">
        <h1 className="workspace-brand">{copy.tasks}</h1>
        <div className="w-52">
          <StatisticSelect
            label={copy.project}
            value={projectId}
            onChange={setProjectId}
            options={[
              { id: 'all', label: copy.allProjects },
              ...snapshot.projects.map((project) => ({
                id: project.id,
                label: project.name,
              })),
            ]}
          />
        </div>
        <nav aria-label={copy.tasks} className="ml-auto">
          <WorkspaceManagement
            snapshot={snapshot}
            onSaved={() => void polling.refresh(true)}
          />
          <Link
            href="/statistics"
            className="px-3 py-3 text-sm text-foreground"
          >
            {copy.statistics}
          </Link>
          <Link
            href="/connections"
            className="px-3 py-3 text-sm text-foreground"
          >
            {copy.connections}
          </Link>
          <WorkspaceSettings
            snapshot={snapshot}
            onSaved={() => void polling.refresh(true)}
          />
        </nav>
        <Button id="new-task" onPress={() => setSelected('new')}>
          {copy.newTask}
        </Button>
      </header>
      <div className="workspace-toolbar">
        <TextField aria-label={copy.search} value={search} onChange={setSearch}>
          <Input placeholder={copy.search} />
        </TextField>
        <div className="w-44">
          <StatisticSelect
            label={copy.assignee}
            value={assigneeId}
            onChange={setAssigneeId}
            options={[
              { id: 'all', label: copy.allAssignees },
              ...snapshot.assignees.map((owner) => ({
                id: owner.id,
                label: owner.name,
              })),
            ]}
          />
        </div>
        <Checkbox isSelected={showCompleted} onChange={setShowCompleted}>
          <Checkbox.Content>
            <Checkbox.Control>
              <Checkbox.Indicator />
            </Checkbox.Control>
            {copy.showCompleted}
          </Checkbox.Content>
        </Checkbox>
        <div className="workspace-sync">
          <div className="w-28">
            <StatisticSelect
              label={copy.sync}
              value={String(polling.seconds)}
              onChange={(value) => polling.setSeconds(Number(value))}
              options={[
                { id: '0', label: copy.paused },
                { id: '15', label: '15 s' },
                { id: '30', label: '30 s' },
                { id: '60', label: '60 s' },
              ]}
            />
          </div>
          <Button variant="ghost" onPress={() => void polling.refresh(true)}>
            {copy.refresh}
          </Button>
        </div>
      </div>
      {polling.failed ? (
        <p role="status" className="workspace-feedback">
          {copy.syncFailed}
        </p>
      ) : null}
      <main
        data-inspecting={selected !== null && selected !== 'new'}
        id="dependency-workspace"
        className="workspace-content"
        tabIndex={-1}
      >
        <TaskGraph
          tasks={graphTasks}
          projects={snapshot.projects}
          selectedId={selected}
          onSelect={setSelected}
          scope={`${projectId}-${assigneeId}-${search}-${showCompleted}`}
          labels={{
            graph: copy.graph,
            zoomIn: copy.zoomIn,
            zoomOut: copy.zoomOut,
            fit: copy.fit,
            empty: copy.empty,
          }}
        />
        {selected ? (
          <WorkspaceTaskPanel
            key={selected}
            id={selected}
            snapshot={snapshot}
            defaultProject={projectId === 'all' ? 'project-general' : projectId}
            onClose={() => setSelected(null)}
            onSaved={saved}
            onSelect={setSelected}
          />
        ) : null}
      </main>
    </div>
  );
}
