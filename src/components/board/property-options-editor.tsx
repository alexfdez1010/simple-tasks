'use client';

import { Button, Input, Label, TextField } from '@heroui/react';

import { useI18n } from '@/lib/i18n/provider';

interface PropertyOptionsEditorProps {
  options: string[];
  onChange: (options: string[]) => void;
}

/**
 * Edits the ordered choices of a select-like property.
 *
 * @param props - Current options and their controlled update callback.
 * @returns An accessible list of option inputs with add and remove controls.
 */
export function PropertyOptionsEditor({
  options,
  onChange,
}: PropertyOptionsEditorProps) {
  const { t } = useI18n();

  /** Updates one option without disturbing the configured order. */
  function updateOption(index: number, option: string) {
    onChange(
      options.map((current, position) =>
        position === index ? option : current,
      ),
    );
  }

  /** Removes one option from the property. */
  function removeOption(index: number) {
    onChange(options.filter((_, position) => position !== index));
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">{t('property.options')}</legend>
      {options.map((option, index) => (
        <div className="flex items-end gap-2" key={index}>
          <TextField
            className="min-w-0 flex-1"
            value={option}
            onChange={(value) => updateOption(index, value)}
          >
            <Label className="sr-only">
              {t('property.optionLabel', { index: index + 1 })}
            </Label>
            <Input
              maxLength={80}
              placeholder={t('property.optionPlaceholder', {
                index: index + 1,
              })}
            />
          </TextField>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label={t('property.deleteOption', { index: index + 1 })}
            onPress={() => removeOption(index)}
          >
            {t('common.delete')}
          </Button>
        </div>
      ))}
      <Button
        type="button"
        className="self-start"
        size="sm"
        variant="secondary"
        onPress={() => onChange([...options, ''])}
      >
        {t('property.addOption')}
      </Button>
    </fieldset>
  );
}
