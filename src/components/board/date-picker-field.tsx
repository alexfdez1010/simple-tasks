'use client';

import type { DateValue } from '@internationalized/date';
import { parseDate } from '@internationalized/date';
import {
  Button,
  Calendar,
  DateField,
  DatePicker,
  Description,
  Label,
} from '@heroui/react';

import { useI18n } from '@/lib/i18n/provider';

interface DatePickerFieldProps {
  description?: string;
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}

/** Converts a persisted ISO date into HeroUI's controlled date value. */
function toDateValue(value: string): DateValue | null {
  if (!value) return null;
  try {
    return parseDate(value);
  } catch {
    return null;
  }
}

/**
 * Renders a controlled HeroUI calendar field backed by an ISO date string.
 *
 * @param props - Field identity, copy, current value, and change callback.
 * @returns A segmented date field with calendar popover and optional clear action.
 */
export function DatePickerField({
  description,
  label,
  name,
  value,
  onChange,
}: DatePickerFieldProps) {
  const { locale, t } = useI18n();
  const accessibleLabel = label.toLocaleLowerCase(locale);

  return (
    <DatePicker
      name={name}
      value={toDateValue(value)}
      onChange={(date) => onChange(date?.toString() ?? '')}
    >
      <Label>{label}</Label>
      <DateField.Group fullWidth>
        <DateField.Input>
          {(segment) => <DateField.Segment segment={segment} />}
        </DateField.Input>
        <DateField.Suffix>
          {value ? (
            <Button
              isIconOnly
              size="sm"
              type="button"
              variant="ghost"
              aria-label={t('date.clear', { label: accessibleLabel })}
              onPress={() => onChange('')}
            >
              <span aria-hidden="true">×</span>
            </Button>
          ) : null}
          <DatePicker.Trigger>
            <DatePicker.TriggerIndicator />
          </DatePicker.Trigger>
        </DateField.Suffix>
      </DateField.Group>
      {description ? <Description>{description}</Description> : null}
      <DatePicker.Popover>
        <Calendar aria-label={t('date.choose', { label: accessibleLabel })}>
          <Calendar.Header>
            <Calendar.YearPickerTrigger>
              <Calendar.YearPickerTriggerHeading />
              <Calendar.YearPickerTriggerIndicator />
            </Calendar.YearPickerTrigger>
            <Calendar.NavButton slot="previous" />
            <Calendar.NavButton slot="next" />
          </Calendar.Header>
          <Calendar.Grid>
            <Calendar.GridHeader>
              {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
            </Calendar.GridHeader>
            <Calendar.GridBody>
              {(date) => <Calendar.Cell date={date} />}
            </Calendar.GridBody>
          </Calendar.Grid>
          <Calendar.YearPickerGrid>
            <Calendar.YearPickerGridBody>
              {({ year }) => <Calendar.YearPickerCell year={year} />}
            </Calendar.YearPickerGridBody>
          </Calendar.YearPickerGrid>
        </Calendar>
      </DatePicker.Popover>
    </DatePicker>
  );
}
