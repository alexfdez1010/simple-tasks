'use client';

import { Modal } from '@heroui/react';

import { getStatisticsCopy } from '@/components/statistics/copy';
import { StatisticForm } from '@/components/statistics/statistic-form';
import { createDefaultStatistic } from '@/components/statistics/statistic-options';
import { useI18n } from '@/lib/i18n/provider';
import type { PropertyDefinition } from '@/lib/properties/types';
import type {
  CreateStatisticInput,
  StatisticDefinition,
  StatisticStatusRecord,
} from '@/lib/statistics/types';

interface StatisticEditorProps {
  definition: StatisticDefinition | null;
  isCreating: boolean;
  properties: PropertyDefinition[];
  statuses: StatisticStatusRecord[];
  onClose: () => void;
  onSave: (
    values: CreateStatisticInput,
  ) => Promise<{ error?: string; success: boolean }>;
}

/** Removes persistence-only fields from an editable statistic definition. */
function toDraft(definition: StatisticDefinition): CreateStatisticInput {
  return {
    color: definition.color,
    dateBucket: definition.dateBucket,
    dateField: definition.dateField,
    datePropertyId: definition.datePropertyId,
    dateRange: definition.dateRange,
    groupBy: definition.groupBy,
    groupPropertyId: definition.groupPropertyId,
    measure: definition.measure,
    measurePropertyId: definition.measurePropertyId,
    name: definition.name,
    scope: definition.scope,
    size: definition.size,
    statusIds: definition.statusIds,
    visualization: definition.visualization,
  };
}

/** Renders the responsive add/edit statistic sheet. */
export function StatisticEditor({
  definition,
  isCreating,
  properties,
  statuses,
  onClose,
  onSave,
}: StatisticEditorProps): React.JSX.Element {
  const { language } = useI18n();
  const isOpen = isCreating || Boolean(definition);
  const draft = definition
    ? toDraft(definition)
    : createDefaultStatistic(getStatisticsCopy(language, 'measureCount'));
  return (
    <Modal>
      <Modal.Backdrop
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Modal.Container
          className="statistics-modal-container"
          placement="auto"
          size="lg"
        >
          <Modal.Dialog
            aria-label={getStatisticsCopy(
              language,
              isCreating ? 'createTitle' : 'editTitle',
            )}
          >
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                {getStatisticsCopy(
                  language,
                  isCreating ? 'createTitle' : 'editTitle',
                )}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <StatisticForm
                key={definition?.id ?? 'new'}
                initialValues={draft}
                properties={properties}
                statuses={statuses}
                submitLabel={getStatisticsCopy(
                  language,
                  isCreating ? 'create' : 'save',
                )}
                onCancel={onClose}
                onSave={onSave}
              />
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
