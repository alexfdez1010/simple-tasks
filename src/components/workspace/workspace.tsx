'use client';

import { useState } from 'react';
import { PwaInstallButton } from '@/components/pwa/pwa-install-button';
import type { WorkspaceSnapshot } from '@/lib/coordination/snapshot';
import { useWorkspacePolling } from '@/components/workspace/use-workspace-polling';
import { useWorkspaceCopy } from '@/components/workspace/copy';
import { TaskGraph } from '@/components/workspace/task-graph';
import { WorkspaceTaskPanel } from '@/components/workspace/task-panel';
import { WorkspaceManagement } from '@/components/workspace/management';
import { WorkspaceSettings } from '@/components/workspace/settings';
import { WorkspaceNavigation } from '@/components/workspace/workspace-navigation';
import { WorkspaceHeader } from '@/components/workspace/workspace-header';
import { WorkspaceToolbar } from '@/components/workspace/workspace-toolbar';
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
  const [storedProjectId, setProjectId] = useState('all');
  const projectId = snapshot.projects.some(
    (project) => project.id === storedProjectId,
  )
    ? storedProjectId
    : 'all';
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
      <WorkspaceNavigation
        projects={snapshot.projects}
        tasks={snapshot.tasks}
        projectId={projectId}
        onProjectChange={setProjectId}
      >
        <PwaInstallButton />
        <WorkspaceManagement
          snapshot={snapshot}
          onSaved={() => void polling.refresh(true)}
        />
        <WorkspaceSettings
          snapshot={snapshot}
          onSaved={() => void polling.refresh(true)}
        />
      </WorkspaceNavigation>
      <div className="workspace-main">
        <WorkspaceHeader
          projects={snapshot.projects}
          projectId={projectId}
          onProjectChange={setProjectId}
          count={filtered.length}
          ready={filtered.filter((task) => task.ready).length}
          onCreate={() => setSelected('new')}
        />
        <WorkspaceToolbar
          search={search}
          onSearchChange={setSearch}
          assigneeId={assigneeId}
          assignees={snapshot.assignees}
          onAssigneeChange={setAssigneeId}
          showCompleted={showCompleted}
          onCompletedChange={setShowCompleted}
          seconds={polling.seconds}
          onSecondsChange={polling.setSeconds}
          onRefresh={() => void polling.refresh(true)}
        />
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
              defaultProject={
                projectId === 'all'
                  ? (snapshot.projects.find(
                      (project) =>
                        project.name.toLocaleLowerCase() === 'miscelánea',
                    )?.id ?? 'project-general')
                  : projectId
              }
              onClose={() => setSelected(null)}
              onSaved={saved}
              onSelect={setSelected}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
