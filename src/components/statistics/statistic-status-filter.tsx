'use client';

import { Description, Label, ListBox, Select } from '@heroui/react';

import { getStatisticsCopy } from '@/components/statistics/copy';
import { useI18n } from '@/lib/i18n/provider';
import type { StatisticStatusRecord } from '@/lib/statistics/types';

interface StatisticStatusFilterProps {
  statuses: StatisticStatusRecord[];
  value: string[];
  onChange: (statusIds: string[]) => void;
}

/** Renders the optional multi-status filter used by every statistic type. */
export function StatisticStatusFilter({
  statuses,
  value,
  onChange,
}: StatisticStatusFilterProps): React.JSX.Element {
  const { language } = useI18n();
  return (
    <Select
      selectionMode="multiple"
      value={value}
      onChange={(statusIds) => onChange(statusIds as string[])}
    >
      <Label>{getStatisticsCopy(language, 'statusFilter')}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Description>
        {getStatisticsCopy(language, 'statusFilterDescription')}
      </Description>
      <Select.Popover>
        <ListBox>
          {statuses.map((status) => (
            <ListBox.Item
              key={status.id}
              id={status.id}
              textValue={status.name}
            >
              {status.name}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
