'use client';

import { Button, Modal, Tabs, useOverlayState } from '@heroui/react';

import { SettingsIcon } from '@/components/board/icons';
import { AutomationSettings } from '@/components/board/automation-settings';
import { LanguageSettings } from '@/components/board/language-settings';
import { PropertySettings } from '@/components/board/property-settings';
import { StatusSettings } from '@/components/board/status-settings';
import { useI18n } from '@/lib/i18n/provider';
import type {
  BoardStatus,
  MutationResult,
  PropertyDefinition,
  PropertyValues,
  StatusValues,
  AutomationDefinition,
  AutomationValues,
} from '@/components/board/types';

interface BoardSettingsProps {
  statuses: BoardStatus[];
  properties: PropertyDefinition[];
  automations: AutomationDefinition[];
  onCreateStatus: (values: StatusValues) => Promise<MutationResult>;
  onUpdateStatus: (id: string, values: StatusValues) => Promise<MutationResult>;
  onDeleteStatus: (id: string) => Promise<MutationResult>;
  onReorderStatus: (id: string, direction: -1 | 1) => Promise<MutationResult>;
  onCreateProperty: (values: PropertyValues) => Promise<MutationResult>;
  onUpdateProperty: (
    id: string,
    values: PropertyValues,
  ) => Promise<MutationResult>;
  onDeleteProperty: (id: string) => Promise<MutationResult>;
  onReorderProperty: (id: string, direction: -1 | 1) => Promise<MutationResult>;
  onCreateAutomation: (values: AutomationValues) => Promise<MutationResult>;
  onUpdateAutomation: (
    id: string,
    values: AutomationValues,
  ) => Promise<MutationResult>;
  onDeleteAutomation: (id: string) => Promise<MutationResult>;
}

/**
 * Combines state and property configuration in one focused settings modal.
 *
 * @param props - Board configuration and mutation callbacks.
 * @returns A compact trigger and tabbed HeroUI modal.
 */
export function BoardSettings(props: BoardSettingsProps) {
  const modalState = useOverlayState();
  const { t } = useI18n();

  return (
    <Modal state={modalState}>
      <Button
        className="board-action-button"
        variant="secondary"
        aria-label={t('settings.ariaLabel')}
      >
        <SettingsIcon className="size-4" />
        <span className="hidden sm:inline">{t('settings.title')}</span>
      </Button>
      <Modal.Backdrop>
        <Modal.Container
          className="board-modal-container"
          placement="auto"
          size="lg"
        >
          <Modal.Dialog aria-label={t('settings.ariaLabel')}>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{t('settings.title')}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <Tabs className="w-full" defaultSelectedKey="statuses">
                <Tabs.ListContainer>
                  <Tabs.List aria-label={t('settings.sections')}>
                    <Tabs.Tab id="statuses">
                      {t('settings.statuses')}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="properties">
                      {t('settings.properties')}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="automations">
                      {t('settings.automations')}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="language">
                      {t('settings.language')}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
                <Tabs.Panel className="pt-5" id="statuses">
                  <StatusSettings
                    statuses={props.statuses}
                    onCreate={props.onCreateStatus}
                    onUpdate={props.onUpdateStatus}
                    onDelete={props.onDeleteStatus}
                    onReorder={props.onReorderStatus}
                  />
                </Tabs.Panel>
                <Tabs.Panel className="pt-5" id="properties">
                  <PropertySettings
                    properties={props.properties}
                    onCreate={props.onCreateProperty}
                    onUpdate={props.onUpdateProperty}
                    onDelete={props.onDeleteProperty}
                    onReorder={props.onReorderProperty}
                  />
                </Tabs.Panel>
                <Tabs.Panel className="pt-5" id="language">
                  <LanguageSettings />
                </Tabs.Panel>
                <Tabs.Panel className="pt-5" id="automations">
                  <AutomationSettings
                    automations={props.automations}
                    statuses={props.statuses}
                    properties={props.properties}
                    onCreate={props.onCreateAutomation}
                    onUpdate={props.onUpdateAutomation}
                    onDelete={props.onDeleteAutomation}
                  />
                </Tabs.Panel>
              </Tabs>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close">{t('settings.done')}</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
