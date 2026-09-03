'use client';

import { Button, Modal } from '@heroui/react';

import { getStatisticsCopy } from '@/components/statistics/copy';
import { useI18n } from '@/lib/i18n/provider';
import type { StatisticDefinition } from '@/lib/statistics/types';

interface StatisticDeleteDialogProps {
  definition: StatisticDefinition | null;
  isPending: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/** Confirms removal of one widget without implying task-data deletion. */
export function StatisticDeleteDialog({
  definition,
  isPending,
  onClose,
  onConfirm,
}: StatisticDeleteDialogProps): React.JSX.Element {
  const { language } = useI18n();
  return (
    <Modal>
      <Modal.Backdrop
        isOpen={Boolean(definition)}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <Modal.Container placement="auto" size="sm">
          <Modal.Dialog
            aria-label={getStatisticsCopy(language, 'deleteConfirm')}
          >
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>
                {getStatisticsCopy(language, 'deleteConfirm')}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p>
                {getStatisticsCopy(language, 'deleteDescription', {
                  name: definition?.name ?? '',
                })}
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="ghost" onPress={onClose}>
                {getStatisticsCopy(language, 'cancel')}
              </Button>
              <Button
                variant="danger"
                isPending={isPending}
                onPress={onConfirm}
              >
                {getStatisticsCopy(language, 'delete')}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
