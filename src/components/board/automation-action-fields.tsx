'use client';

import { Label, ListBox, Select } from '@heroui/react';

import { TaskPropertyFields } from '@/components/board/task-property-fields';
import type {
  AutomationValues,
  PropertyDefinition,
} from '@/components/board/types';
import { useI18n } from '@/lib/i18n/provider';

interface AutomationActionFieldsProps {
  properties: PropertyDefinition[];
  values: AutomationValues;
  onChange: (values: AutomationValues) => void;
}

/** Renders the action selector and the matching typed property editor. */
export function AutomationActionFields({
  properties,
  values,
  onChange,
}: AutomationActionFieldsProps) {
  const { t } = useI18n();
  const selectedProperty = properties.find(
    (property) => property.id === values.propertyId,
  );

  /** Changes action and removes stale fields from the other action type. */
  function changeAction(actionType: AutomationValues['actionType']) {
    onChange({
      ...values,
      actionType,
      propertyId:
        actionType === 'SET_PROPERTY_VALUE' ? values.propertyId : null,
      propertyValue:
        actionType === 'SET_PROPERTY_VALUE' ? values.propertyValue : null,
    });
  }

  return (
    <>
      <Select
        selectedKey={values.actionType}
        onSelectionChange={(actionType) =>
          changeAction(String(actionType) as AutomationValues['actionType'])
        }
      >
        <Label>{t('automation.action')}</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            <ListBox.Item
              id="SET_COMPLETION_DATE_TODAY"
              textValue={t('automation.actionCompletion')}
            >
              {t('automation.actionCompletion')}
              <ListBox.ItemIndicator />
            </ListBox.Item>
            <ListBox.Item
              id="SET_PROPERTY_VALUE"
              textValue={t('automation.actionProperty')}
            >
              {t('automation.actionProperty')}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          </ListBox>
        </Select.Popover>
      </Select>
      {values.actionType === 'SET_PROPERTY_VALUE' ? (
        properties.length > 0 ? (
          <div className="flex flex-col gap-4 rounded-xl bg-surface-secondary p-3 sm:col-span-2">
            <Select
              selectedKey={values.propertyId ?? undefined}
              onSelectionChange={(propertyId) =>
                onChange({
                  ...values,
                  propertyId: String(propertyId),
                  propertyValue: null,
                })
              }
            >
              <Label>{t('automation.property')}</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {properties.map((property) => (
                    <ListBox.Item
                      key={property.id}
                      id={property.id}
                      textValue={property.name}
                    >
                      {property.name}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
            {selectedProperty ? (
              <TaskPropertyFields
                properties={[selectedProperty]}
                values={
                  values.propertyValue === null
                    ? []
                    : [
                        {
                          propertyId: values.propertyId!,
                          value: values.propertyValue,
                        },
                      ]
                }
                onChange={(propertyValues) =>
                  onChange({
                    ...values,
                    propertyValue: propertyValues[0]?.value ?? null,
                  })
                }
              />
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted sm:col-span-2">
            {t('automation.noProperties')}
          </p>
        )
      ) : (
        <p className="rounded-xl bg-surface-secondary p-3 text-sm text-muted sm:col-span-2">
          {t('automation.completionHint')}
        </p>
      )}
    </>
  );
}
