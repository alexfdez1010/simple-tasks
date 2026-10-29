'use client';

import { Button, Dropdown, Label } from '@heroui/react';
import { getStatisticsCopy } from '@/components/statistics/copy';
import { WorkspaceIcon } from '@/components/workspace/workspace-icons';
import { useI18n } from '@/lib/i18n/provider';

interface StatisticActionsProps {
  name: string;
  canMoveEarlier: boolean;
  canMoveLater: boolean;
  isPending: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onMove: (direction: -1 | 1) => void;
}

/** Offers one compact accessible menu; pending work and boundary positions disable unavailable actions. */
export function StatisticActions({
  name,
  canMoveEarlier,
  canMoveLater,
  isPending,
  onDelete,
  onEdit,
  onMove,
}: StatisticActionsProps) {
  const { language } = useI18n();
  const menuLabel = `${getStatisticsCopy(language, 'actions')}: ${name}`;
  const disabledKeys = isPending
    ? ['earlier', 'later', 'edit', 'delete']
    : [
        ...(!canMoveEarlier ? ['earlier'] : []),
        ...(!canMoveLater ? ['later'] : []),
      ];
  /** Dispatches a deliberate menu choice to the injected canvas callbacks without changing widget data. */
  function act(key: string | number) {
    if (key === 'earlier') onMove(-1);
    else if (key === 'later') onMove(1);
    else if (key === 'edit') onEdit();
    else if (key === 'delete') onDelete();
  }
  return (
    <div className="statistics-widget-actions">
      <Dropdown>
        <Button
          isIconOnly
          isDisabled={isPending}
          variant="ghost"
          aria-label={menuLabel}
        >
          <WorkspaceIcon name="more" className="size-5" />
        </Button>
        <Dropdown.Popover
          placement="bottom end"
          className="statistics-action-menu"
        >
          <Dropdown.Menu
            aria-label={menuLabel}
            disabledKeys={disabledKeys}
            onAction={act}
          >
            <Dropdown.Item
              id="earlier"
              className="min-h-11"
              textValue={getStatisticsCopy(language, 'moveEarlier', { name })}
              aria-label={getStatisticsCopy(language, 'moveEarlier', { name })}
            >
              <WorkspaceIcon name="arrow" className="size-4 rotate-180" />
              <Label>
                {getStatisticsCopy(language, 'moveEarlier', { name: '' })}
              </Label>
            </Dropdown.Item>
            <Dropdown.Item
              id="later"
              className="min-h-11"
              textValue={getStatisticsCopy(language, 'moveLater', { name })}
              aria-label={getStatisticsCopy(language, 'moveLater', { name })}
            >
              <WorkspaceIcon name="arrow" className="size-4" />
              <Label>
                {getStatisticsCopy(language, 'moveLater', { name: '' })}
              </Label>
            </Dropdown.Item>
            <Dropdown.Item
              id="edit"
              className="min-h-11"
              textValue={`${getStatisticsCopy(language, 'edit')}: ${name}`}
              aria-label={`${getStatisticsCopy(language, 'edit')}: ${name}`}
            >
              <WorkspaceIcon name="edit" className="size-4" />
              <Label>{getStatisticsCopy(language, 'edit')}</Label>
            </Dropdown.Item>
            <Dropdown.Item
              id="delete"
              className="min-h-11"
              variant="danger"
              textValue={`${getStatisticsCopy(language, 'delete')}: ${name}`}
              aria-label={`${getStatisticsCopy(language, 'delete')}: ${name}`}
            >
              <WorkspaceIcon name="trash" className="size-4" />
              <Label>{getStatisticsCopy(language, 'delete')}</Label>
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>
    </div>
  );
}
