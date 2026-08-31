'use client';

import { Button, Link, ProgressBar } from '@heroui/react';
import { useNumberFormatter } from '@react-aria/i18n';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import appIcon from '@/app/icon.png';
import { BoardSettings } from '@/components/board/board-settings';
import { getBoardMetrics } from '@/components/board/board-metrics';
import { KanbanBoard } from '@/components/board/kanban-board';
import type { BoardStatus, PropertyDefinition } from '@/components/board/types';
import { usePropertyMutations } from '@/components/board/use-property-mutations';
import { useServerReconciledState } from '@/components/board/use-server-reconciled-state';
import { useStatusMutations } from '@/components/board/use-status-mutations';
import { useTaskMutations } from '@/components/board/use-task-mutations';
import { logoutAction } from '@/lib/auth/actions';
import { useI18n } from '@/lib/i18n/provider';
import type { TranslationKey } from '@/lib/i18n/translations';

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
  const numberFormatter = useNumberFormatter();
  const [statuses, setStatuses] = useServerReconciledState(initialStatuses);
  const [properties, setProperties] =
    useServerReconciledState(initialProperties);
  const [announcement, setAnnouncement] = useState('');
  const metrics = getBoardMetrics(statuses);

  /** Gets the localized metric label while keeping its count separately emphasized. */
  const metricLabel = (key: TranslationKey): string =>
    t(key, { count: '' }).trim();

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
      <header className="board-toolbar-wrap">
        <div className="board-toolbar">
          <div className="flex min-w-0 items-center gap-3">
            <span className="board-mark" aria-hidden="true">
              <Image
                alt=""
                className="size-full"
                priority
                sizes="40px"
                src={appIcon}
              />
            </span>
            <h1 className="min-w-0 text-xl font-semibold tracking-[-0.035em] sm:text-2xl">
              {t('board.title')}
            </h1>
          </div>

          <div className="board-actions">
            <Link
              className="board-action-link text-sm font-medium"
              href="/automations"
            >
              {t('board.automations')}
            </Link>
            <Link
              className="board-action-link text-sm font-medium"
              href="/skill"
            >
              {t('board.ai')}
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
              <Button
                className="board-action-button"
                type="submit"
                variant="ghost"
              >
                {t('board.signOut')}
              </Button>
            </form>
          </div>

          <div className="board-metrics" aria-label={t('board.summary')}>
            <p className="board-metric-copy">
              <span className="font-semibold text-foreground tabular-nums">
                {numberFormatter.format(metrics.activeCount)}
              </span>{' '}
              {metricLabel(
                metrics.activeCount === 1
                  ? 'board.active.one'
                  : 'board.active.other',
              )}
              <span aria-hidden="true"> · </span>
              <span className="font-semibold text-foreground tabular-nums">
                {numberFormatter.format(metrics.completedCount)}
              </span>{' '}
              {metricLabel(
                metrics.completedCount === 1
                  ? 'board.finished.one'
                  : 'board.finished.other',
              )}
            </p>
            <ProgressBar
              aria-label={t(
                metrics.visibleCount === 1
                  ? 'board.progress.one'
                  : 'board.progress.other',
                {
                  count: numberFormatter.format(metrics.visibleCount),
                  percentage: numberFormatter.format(
                    metrics.completionPercentage,
                  ),
                },
              )}
              className="board-progress"
              value={metrics.completionPercentage}
            >
              <ProgressBar.Track className="board-progress-track">
                <ProgressBar.Fill className="board-progress-fill" />
              </ProgressBar.Track>
            </ProgressBar>
            <p className="board-visible-count tabular-nums">
              {t(
                metrics.visibleCount === 1
                  ? 'board.visible.one'
                  : 'board.visible.other',
                { count: numberFormatter.format(metrics.visibleCount) },
              )}
            </p>
          </div>
        </div>
      </header>

      <main id="task-board" className="board-workspace">
        <KanbanBoard
          statuses={statuses}
          properties={properties}
          setStatuses={setStatuses}
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
