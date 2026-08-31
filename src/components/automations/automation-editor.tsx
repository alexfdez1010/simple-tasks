'use client';

import { Alert, Button, Card, Input, Label, TextField } from '@heroui/react';
import { useState } from 'react';

import { AutomationActionFields } from '@/components/automations/automation-action-fields';
import { AutomationClause } from '@/components/automations/automation-clause';
import {
  normalizeAutomationValues,
  validateAutomationValues,
  type AutomationValidationIssue,
} from '@/components/automations/automation-draft';
import { AutomationTriggerFields } from '@/components/automations/automation-trigger-fields';
import type {
  AutomationMutationResult,
  AutomationStatus,
  AutomationValues,
  PropertyDefinition,
} from '@/components/automations/types';
import { useI18n } from '@/lib/i18n/provider';

interface AutomationEditorProps {
  initialValues: AutomationValues;
  isEditing: boolean;
  properties: PropertyDefinition[];
  statuses: AutomationStatus[];
  onCancel: () => void;
  onSave: (values: AutomationValues) => Promise<AutomationMutationResult>;
}

/** Maps a domain validation issue to concise localized recovery copy. */
function validationMessage(
  issue: AutomationValidationIssue,
  t: ReturnType<typeof useI18n>['t'],
): string {
  const keys = {
    name: 'automation.enterName',
    triggerStatus: 'automation.chooseTriggerStatus',
    scheduledDate: 'automation.chooseScheduledDate',
    taskTemplate: 'automation.completeTaskTemplate',
    propertyValue: 'automation.chooseProperty',
  } as const;
  return t(keys[issue]);
}

/** Edits one complete automation through visible trigger and action clauses. */
export function AutomationEditor({
  initialValues,
  isEditing,
  properties,
  statuses,
  onCancel,
  onSave,
}: AutomationEditorProps): React.JSX.Element {
  const { t } = useI18n();
  const [values, setValues] = useState(initialValues);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Validates, normalizes, and persists the current rule draft. */
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const issue = validateAutomationValues(values);
    if (issue) return setError(validationMessage(issue, t));
    setError(null);
    setIsPending(true);
    const result = await onSave(normalizeAutomationValues(values));
    setIsPending(false);
    if (!result.success) setError(result.error ?? t('automation.saveFallback'));
  }

  return (
    <Card className="automation-editor-card" variant="default">
      <Card.Header className="automation-editor-header">
        <div>
          <p className="automation-editor-kicker">
            {isEditing
              ? t('automation.editorEditing')
              : t('automation.editorNew')}
          </p>
          <Card.Title>
            {isEditing
              ? t('automation.editorEditTitle')
              : t('automation.editorCreateTitle')}
          </Card.Title>
          <Card.Description>
            {t('automation.editorDescription')}
          </Card.Description>
        </div>
      </Card.Header>
      <Card.Content>
        <form className="automation-editor-form" onSubmit={handleSubmit}>
          <TextField
            isRequired
            value={values.name}
            onChange={(name) => setValues((current) => ({ ...current, name }))}
          >
            <Label>{t('automation.name')}</Label>
            <Input
              maxLength={120}
              placeholder={t('automation.namePlaceholder')}
            />
          </TextField>
          <div className="automation-clause-stack">
            <AutomationClause
              description={t('automation.whenDescription')}
              label={t('automation.when')}
              step={1}
            >
              <AutomationTriggerFields
                statuses={statuses}
                values={values}
                onChange={setValues}
              />
            </AutomationClause>
            <AutomationClause
              description={t('automation.thenDescription')}
              label={t('automation.then')}
              step={2}
            >
              <AutomationActionFields
                properties={properties}
                statuses={statuses}
                values={values}
                onChange={setValues}
              />
            </AutomationClause>
          </div>
          {error ? (
            <Alert status="danger">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Description>{error}</Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}
          <div className="automation-editor-actions">
            <Button type="button" variant="ghost" onPress={onCancel}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" isPending={isPending}>
              {isEditing ? t('common.save') : t('automation.create')}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card>
  );
}
