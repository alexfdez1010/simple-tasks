'use client';

import { Button, Link } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BoardSettings } from '@/components/board/board-settings';
import { KanbanBoard } from '@/components/board/kanban-board';
import type { BoardStatus, PropertyDefinition } from '@/components/board/types';
import { usePropertyMutations } from '@/components/board/use-property-mutations';
import { useStatusMutations } from '@/components/board/use-status-mutations';
import { useTaskMutations } from '@/components/board/use-task-mutations';
import { logoutAction } from '@/lib/auth/actions';

interface BoardShellProps {
  initialStatuses: BoardStatus[];
  initialProperties: PropertyDefinition[];
}

/**
 * Owns client board state and composes all workflow interactions.
 *
 * @param props - Serializable workflow and property data loaded by the server.
 * @returns The complete authenticated task-management interface.
 */
export function BoardShell({
  initialStatuses,
  initialProperties,
}: BoardShellProps) {
  const router = useRouter();
  const [statuses, setStatuses] = useState(initialStatuses);
  const [properties, setProperties] = useState(initialProperties);
  const [announcement, setAnnouncement] = useState('');
  const taskCount = statuses.reduce(
    (total, status) => total + status.tasks.length,
    0,
  );
  const taskMutations = useTaskMutations({
    statuses,
    setStatuses,
    refresh: router.refresh,
    announce: setAnnouncement,
  });
  const statusMutations = useStatusMutations({
    statuses,
    setStatuses,
    refresh: router.refresh,
  });
  const propertyMutations = usePropertyMutations({
    statuses,
    properties,
    setStatuses,
    setProperties,
    refresh: router.refresh,
  });

  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-divider bg-background/90 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Tasks
            </h1>
            <p className="hidden text-sm text-muted sm:block">
              {taskCount} {taskCount === 1 ? 'task' : 'tasks'} on the board
            </p>
          </div>
          <div className="ms-auto flex items-center gap-1.5 sm:gap-2">
            <Link className="px-2 text-sm font-medium" href="/skill">
              AI
            </Link>
            <BoardSettings
              statuses={statuses}
              properties={properties}
              onCreateStatus={statusMutations.create}
              onUpdateStatus={statusMutations.update}
              onDeleteStatus={statusMutations.remove}
              onReorderStatus={statusMutations.reorder}
              onCreateProperty={propertyMutations.create}
              onUpdateProperty={propertyMutations.update}
              onDeleteProperty={propertyMutations.remove}
              onReorderProperty={propertyMutations.reorder}
            />
            <form action={logoutAction}>
              <Button type="submit" variant="ghost">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden py-5 sm:py-6">
        <KanbanBoard
          statuses={statuses}
          properties={properties}
          setStatuses={setStatuses}
          onUpdate={taskMutations.update}
          onCreate={taskMutations.create}
          onDelete={taskMutations.remove}
          onPersistDrag={taskMutations.persistDrag}
        />
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </main>
  );
}
