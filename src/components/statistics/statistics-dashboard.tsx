'use client';

import { Button, Card } from '@heroui/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { getStatisticsCopy } from '@/components/statistics/copy';
import { StatisticsHeader } from '@/components/statistics/statistics-header';
import { StatisticCard } from '@/components/statistics/statistic-card';
import { StatisticDeleteDialog } from '@/components/statistics/statistic-delete-dialog';
import { StatisticEditor } from '@/components/statistics/statistic-editor';
import { useI18n } from '@/lib/i18n/provider';
import {
  createStatisticAction,
  deleteStatisticAction,
  reorderStatisticsAction,
  updateStatisticAction,
} from '@/lib/statistics/actions';
import type {
  CreateStatisticInput,
  StatisticDefinition,
  StatisticsSnapshot,
} from '@/lib/statistics/types';

interface StatisticsDashboardProps {
  snapshot: StatisticsSnapshot;
}

type EditorState =
  { mode: 'create' } | { definition: StatisticDefinition; mode: 'edit' } | null;

/** Composes the localized, user-configurable statistics workbench. */
export function StatisticsDashboard({
  snapshot,
}: StatisticsDashboardProps): React.JSX.Element {
  const { language } = useI18n();
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [editor, setEditor] = useState<EditorState>(null);
  const [deleting, setDeleting] = useState<StatisticDefinition | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const definitions = snapshot.statistics.map(({ definition }) => definition);

  /** Creates or updates the statistic selected by the editor. */
  async function handleSave(
    values: CreateStatisticInput,
  ): Promise<{ error?: string; success: boolean }> {
    const result =
      editor?.mode === 'edit'
        ? await updateStatisticAction({ id: editor.definition.id, ...values })
        : await createStatisticAction(values);
    if (result.success) {
      setEditor(null);
      setError(null);
      router.refresh();
    }
    return result;
  }

  /** Deletes the currently confirmed widget and refreshes its canvas. */
  async function handleDelete(): Promise<void> {
    if (!deleting) return;
    setPendingId(deleting.id);
    const result = await deleteStatisticAction(deleting.id);
    setPendingId(null);
    if (result.success) {
      setDeleting(null);
      setError(null);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  /** Moves one widget by a single position using exact ordered membership. */
  async function handleMove(index: number, direction: -1 | 1): Promise<void> {
    const target = index + direction;
    if (!definitions[index] || target < 0 || target >= definitions.length)
      return;
    const ids = definitions.map(({ id }) => id);
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    setPendingId(definitions[index].id);
    const result = await reorderStatisticsAction({ statisticIds: ids });
    setPendingId(null);
    if (result.success) {
      setError(null);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="statistics-app min-h-dvh bg-background text-foreground">
      <a className="skip-link" href="#statistics-content">
        {getStatisticsCopy(language, 'skipToStatistics')}
      </a>
      <StatisticsHeader
        widgetCount={definitions.length}
        isFocused={isFocused}
        onCreate={() => setEditor({ mode: 'create' })}
        onToggleFocus={() => setIsFocused((value) => !value)}
      />

      <main
        id="statistics-content"
        className="statistics-main"
        data-focus={isFocused}
      >
        {error ? (
          <p className="statistics-error" role="alert">
            {error}
          </p>
        ) : null}
        {snapshot.statistics.length === 0 ? (
          <Card className="statistics-empty" variant="secondary">
            <Card.Header>
              <Card.Title>
                {getStatisticsCopy(language, 'emptyTitle')}
              </Card.Title>
              <Card.Description>
                {getStatisticsCopy(language, 'emptyDescription')}
              </Card.Description>
            </Card.Header>
            <Card.Footer>
              <Button onPress={() => setEditor({ mode: 'create' })}>
                {getStatisticsCopy(language, 'addFirst')}
              </Button>
            </Card.Footer>
          </Card>
        ) : (
          <section
            className="statistics-canvas"
            aria-label={getStatisticsCopy(language, 'heading')}
          >
            {snapshot.statistics.map((statistic, index) => (
              <StatisticCard
                canMoveEarlier={index > 0}
                canMoveLater={index < snapshot.statistics.length - 1}
                isPending={pendingId === statistic.definition.id}
                key={statistic.definition.id}
                statistic={statistic}
                onDelete={() => setDeleting(statistic.definition)}
                onEdit={() =>
                  setEditor({ definition: statistic.definition, mode: 'edit' })
                }
                onMove={(direction) => void handleMove(index, direction)}
              />
            ))}
          </section>
        )}
      </main>

      <StatisticEditor
        definition={editor?.mode === 'edit' ? editor.definition : null}
        isCreating={editor?.mode === 'create'}
        properties={snapshot.properties}
        statuses={snapshot.statuses}
        onClose={() => setEditor(null)}
        onSave={handleSave}
      />
      <StatisticDeleteDialog
        definition={deleting}
        isPending={Boolean(deleting && pendingId === deleting.id)}
        onClose={() => setDeleting(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
