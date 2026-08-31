'use client';

import { Label, ListBox, Select } from '@heroui/react';

import { changeAutomationAction } from '@/components/automations/automation-draft';
import { AutomationScheduledFields } from '@/components/automations/automation-scheduled-fields';
import type {
  AutomationStatus,
  AutomationValues,
  PropertyDefinition,
} from '@/components/automations/types';
import { TaskPropertyFields } from '@/components/board/task-property-fields';
import { useI18n } from '@/lib/i18n/provider';

interface AutomationActionFieldsProps {
  statuses: AutomationStatus[];
  properties: PropertyDefinition[];
  values: AutomationValues;
  onChange: (values: AutomationValues) => void;
}

/** Renders the action selector and the matching typed editor. */
export function AutomationActionFields({
  statuses,
  properties,
  values,
  onChange,
}: AutomationActionFieldsProps): React.JSX.Element {
  const { t } = useI18n();
  const selectedProperty = properties.find(
    (property) => property.id === values.propertyId,
  );

  if (values.triggerType === 'SCHEDULED') {
    return (
      <AutomationScheduledFields
        properties={properties}
        statuses={statuses}
        values={values}
        onChange={onChange}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Select
        selectedKey={values.actionType}
        onSelectionChange={(actionType) =>
          onChange(
            changeAutomationAction(
              values,
              String(actionType) as AutomationValues['actionType'],
            ),
          )
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
          <div className="automation-property-action">
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
          <p className="automation-inline-note">
            {t('automation.noProperties')}
          </p>
        )
      ) : (
        <p className="automation-inline-note">
          {t('automation.completionHint')}
        </p>
      )}
    </div>
  );
}
