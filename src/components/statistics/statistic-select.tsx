'use client';

import { Label, ListBox, Select } from '@heroui/react';

interface SelectOption {
  id: string;
  label: string;
}

interface StatisticSelectProps {
  label: string;
  options: SelectOption[];
  value: string | null;
  onChange: (value: string) => void;
}

/** Renders one reusable controlled HeroUI selector for statistic fields. */
export function StatisticSelect({
  label,
  options,
  value,
  onChange,
}: StatisticSelectProps): React.JSX.Element {
  return (
    <Select
      selectedKey={value ?? undefined}
      onSelectionChange={(selection) => onChange(String(selection))}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item
              key={option.id}
              id={option.id}
              textValue={option.label}
            >
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
