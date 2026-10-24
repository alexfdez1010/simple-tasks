'use client';

import { Label, ListBox, Select } from '@heroui/react';
import type { BoardStatus } from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface ColumnNavigationProps {
  statuses: BoardStatus[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** Offers a touch and keyboard route to any column; counts describe the visible preview. */
export function ColumnNavigation({
  statuses,
  selectedId,
  onSelect,
}: ColumnNavigationProps) {
  const { t } = useI18n();
  return (
    <div className="board-column-navigation">
      <Select
        aria-label={t('board.chooseColumn')}
        value={selectedId}
        onChange={(id) => {
          if (id) onSelect(String(id));
        }}
      >
        <Label className="sr-only">{t('board.chooseColumn')}</Label>
        <Select.Trigger className="min-h-11 w-full">
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox aria-label={t('board.chooseColumn')}>
            {statuses.map((status) => (
              <ListBox.Item
                id={status.id}
                key={status.id}
                textValue={`${status.name} · ${status.tasks.length}`}
              >
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {status.name} · {status.tasks.length}
                </span>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}
