'use client';

import { Label, Radio, RadioGroup } from '@heroui/react';

import { getStatisticsCopy } from '@/components/statistics/copy';
import {
  COLORS,
  SIZES,
  localizeStatisticOptions,
} from '@/components/statistics/statistic-options';
import { StatisticColor, StatisticSize } from '@/generated/prisma';
import { useI18n } from '@/lib/i18n/provider';
import type { CreateStatisticInput } from '@/lib/statistics/types';

interface StatisticAppearanceFieldsProps {
  values: CreateStatisticInput;
  onChange: (values: CreateStatisticInput) => void;
}

/** Renders named palette swatches and responsive card-format previews. */
export function StatisticAppearanceFields({
  values,
  onChange,
}: StatisticAppearanceFieldsProps): React.JSX.Element {
  const { language } = useI18n();
  const colors = localizeStatisticOptions(language, COLORS);
  const sizes = localizeStatisticOptions(language, SIZES);

  return (
    <div className="statistics-appearance">
      <RadioGroup
        className="statistics-appearance-group statistics-color-group"
        name="statistic-color"
        value={values.color}
        variant="secondary"
        onChange={(color) =>
          onChange({ ...values, color: color as StatisticColor })
        }
      >
        <Label>{getStatisticsCopy(language, 'color')}</Label>
        {colors.map((option) => (
          <Radio key={option.id} value={option.id}>
            <Radio.Content className="statistics-appearance-option">
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <span
                aria-hidden="true"
                className="statistics-color-swatch"
                data-color={option.id}
              />
              <span>{option.label}</span>
            </Radio.Content>
          </Radio>
        ))}
      </RadioGroup>

      <RadioGroup
        className="statistics-appearance-group statistics-size-group"
        name="statistic-size"
        value={values.size}
        variant="secondary"
        onChange={(size) =>
          onChange({ ...values, size: size as StatisticSize })
        }
      >
        <Label>{getStatisticsCopy(language, 'size')}</Label>
        {sizes.map((option) => (
          <Radio key={option.id} value={option.id}>
            <Radio.Content className="statistics-appearance-option statistics-size-option">
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <span
                aria-hidden="true"
                className="statistics-size-preview"
                data-size={option.id}
              />
              <span>{option.label}</span>
            </Radio.Content>
          </Radio>
        ))}
      </RadioGroup>
    </div>
  );
}
