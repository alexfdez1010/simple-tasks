'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BoardSettings } from '@/components/board/board-settings';
import { BoardHeader } from '@/components/board/board-header';
import { ColumnNavigation } from '@/components/board/column-navigation';
import { useBoardNavigation } from '@/components/board/use-board-navigation';
import { KanbanBoard } from '@/components/board/kanban-board';
import type { BoardStatus, PropertyDefinition } from '@/components/board/types';
import { usePropertyMutations } from '@/components/board/use-property-mutations';
import { useServerReconciledState } from '@/components/board/use-server-reconciled-state';
import { useStatusMutations } from '@/components/board/use-status-mutations';
import { useTaskMutations } from '@/components/board/use-task-mutations';
import { useI18n } from '@/lib/i18n/provider';

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
  const { t } = useI18n();
  const [statuses, setStatuses] = useServerReconciledState(initialStatuses);
  const [properties, setProperties] =
    useServerReconciledState(initialProperties);
  const [announcement, setAnnouncement] = useState('');
  const navigation = useBoardNavigation(statuses);

  const taskMutations = useTaskMutations({
    statuses,
    setStatuses,
    refresh: router.refresh,
    announce: setAnnouncement,
    t,
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
    <div className="board-app min-h-dvh bg-background text-foreground">
      <a className="skip-link" href="#task-board">
        {t('board.skipToTaskBoard')}
      </a>
      <BoardHeader
        onCreate={() => navigation.startCreate()}
        columnNavigation={
          <ColumnNavigation
            statuses={statuses}
            selectedId={navigation.activeId}
            onSelect={navigation.selectColumn}
          />
        }
      >
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
      </BoardHeader>

      <main id="task-board" className="board-workspace" tabIndex={-1}>
        <KanbanBoard
          navigation={navigation}
          statuses={statuses}
          properties={properties}
          setStatuses={setStatuses}
          onMove={taskMutations.moveTask}
          onUpdate={taskMutations.update}
          onCreate={taskMutations.create}
          onDelete={taskMutations.remove}
          onPersistDrag={taskMutations.persistDrag}
        />
      </main>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  );
}
