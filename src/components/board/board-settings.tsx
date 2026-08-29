'use client';

import { Button, Modal, Tabs, useOverlayState } from '@heroui/react';

import { SettingsIcon } from '@/components/board/icons';
import { PropertySettings } from '@/components/board/property-settings';
import { StatusSettings } from '@/components/board/status-settings';
import type {
  BoardStatus,
  MutationResult,
  PropertyDefinition,
  PropertyValues,
  StatusValues,
} from '@/components/board/types';

interface BoardSettingsProps {
  statuses: BoardStatus[];
  properties: PropertyDefinition[];
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
}

/**
 * Combines state and property configuration in one focused settings modal.
 *
 * @param props - Board configuration and mutation callbacks.
 * @returns A compact trigger and tabbed HeroUI modal.
 */
export function BoardSettings(props: BoardSettingsProps) {
  const modalState = useOverlayState();

  return (
    <Modal state={modalState}>
      <Button
        variant="secondary"
        aria-label="Settings · Configure statuses and properties"
      >
        <SettingsIcon className="size-4" />
        <span className="hidden sm:inline">Settings</span>
      </Button>
      <Modal.Backdrop>
        <Modal.Container placement="center" size="lg">
          <Modal.Dialog aria-label="Settings · Configure statuses and properties">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>Settings</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <Tabs className="w-full" defaultSelectedKey="statuses">
                <Tabs.ListContainer>
                  <Tabs.List aria-label="Settings sections">
                    <Tabs.Tab id="statuses">
                      Statuses
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="properties">
                      Properties
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
              </Tabs>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close">Done</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
