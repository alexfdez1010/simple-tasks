'use client';

import { Button, Link } from '@heroui/react';
import type { ReactNode } from 'react';
import { AppLogo } from '@/components/app-logo';
import { WorkspaceIcon } from '@/components/workspace/workspace-icons';
import { useWorkspaceCopy } from '@/components/workspace/copy';

type NavigationProps = {
  projects: { id: string; name: string }[];
  tasks: { projectId: string; status: { isTerminal: boolean } }[];
  projectId: string;
  onProjectChange: (id: string) => void;
  children?: ReactNode;
};

/** Composes named navigation and real project counts; changing a project preserves open task drafts. */
export function WorkspaceNavigation({
  projects,
  tasks,
  projectId,
  onProjectChange,
  children,
}: NavigationProps) {
  const copy = useWorkspaceCopy();
  const active = tasks.filter((task) => !task.status.isTerminal);
  return (
    <div className="workspace-navigation">
      <Link href="/" className="workspace-wordmark" aria-label="Simple Tasks">
        <AppLogo className="workspace-logo" />
        <span>
          simple<span className="font-semibold">tasks</span>
        </span>
      </Link>
      <nav className="workspace-primary-nav" aria-label={copy.navigation}>
        <Link href="/" aria-current="page" className="workspace-nav-link">
          <WorkspaceIcon name="tasks" />
          <span>{copy.tasks}</span>
          <span className="workspace-nav-count">{active.length}</span>
        </Link>
        <Link href="/statistics" className="workspace-nav-link">
          <WorkspaceIcon name="chart" />
          <span>{copy.statistics}</span>
        </Link>
        <Link href="/connections" className="workspace-nav-link">
          <WorkspaceIcon name="connections" />
          <span>{copy.connections}</span>
        </Link>
      </nav>
      <div className="workspace-projects">
        <p className="workspace-nav-heading">{copy.projects}</p>
        <Button
          variant="ghost"
          className="workspace-project-link"
          aria-pressed={projectId === 'all'}
          onPress={() => onProjectChange('all')}
        >
          <WorkspaceIcon name="folder" />
          <span>{copy.allProjects}</span>
          <span className="workspace-nav-count">{active.length}</span>
        </Button>
        {projects.map((project) => (
          <Button
            key={project.id}
            variant="ghost"
            className="workspace-project-link"
            aria-pressed={projectId === project.id}
            onPress={() => onProjectChange(project.id)}
          >
            <span className="workspace-project-dot" />
            <span className="truncate">{project.name}</span>
            <span className="workspace-nav-count">
              {active.filter((task) => task.projectId === project.id).length}
            </span>
          </Button>
        ))}
      </div>
      <div className="workspace-nav-footer">
        {children}
        <span className="workspace-footer-note">{copy.connectedWork}</span>
      </div>
    </div>
  );
}
