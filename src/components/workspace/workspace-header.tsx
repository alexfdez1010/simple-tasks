'use client';

import { Button } from '@heroui/react';
import { StatisticSelect } from '@/components/statistics/statistic-select';
import { WorkspaceIcon } from '@/components/workspace/workspace-icons';
import { useWorkspaceCopy } from '@/components/workspace/copy';

type HeaderProps = {
  projectId: string;
  projects: { id: string; name: string }[];
  count: number;
  ready: number;
  onProjectChange: (id: string) => void;
  onCreate: () => void;
};

/** Presents workspace context from the filtered snapshot and one primary task-creation action. */
export function WorkspaceHeader({
  projectId,
  projects,
  count,
  ready,
  onProjectChange,
  onCreate,
}: HeaderProps) {
  const copy = useWorkspaceCopy();
  return (
    <header className="workspace-header">
      <div className="workspace-heading">
        <h1 className="workspace-brand">
          {copy.tasks}
          <span className="workspace-heading-count" aria-hidden="true">
            {count}
          </span>
        </h1>
        <p className="workspace-subtitle">
          {copy.workOverview}
          <span className="workspace-ready-summary">
            <WorkspaceIcon name="check" className="size-3.5" />
            {ready}{' '}
            {ready === 1 ? copy.ready.toLocaleLowerCase() : copy.readyPlural}
          </span>
        </p>
      </div>
      <div className="workspace-project-select">
        <StatisticSelect
          label={copy.project}
          value={projectId}
          onChange={onProjectChange}
          options={[
            { id: 'all', label: copy.allProjects },
            ...projects.map((project) => ({
              id: project.id,
              label: project.name,
            })),
          ]}
        />
      </div>
      <Button id="new-task" onPress={onCreate}>
        <WorkspaceIcon name="plus" />
        {copy.newTask}
      </Button>
    </header>
  );
}
