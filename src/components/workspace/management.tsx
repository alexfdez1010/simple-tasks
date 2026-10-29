'use client';

import { Button, Modal, Tabs } from '@heroui/react';
import type { WorkspaceSnapshot } from '@/lib/coordination/snapshot';
import { EntityManager } from '@/components/workspace/entity-manager';
import { useWorkspaceCopy } from '@/components/workspace/copy';

/** Provides one quiet entry point for dynamic assignees and projects without adding graph-side administration. */
export function WorkspaceManagement({
  snapshot,
  onSaved,
}: {
  snapshot: WorkspaceSnapshot;
  onSaved: () => void;
}) {
  const copy = useWorkspaceCopy();
  return (
    <Modal>
      <Button variant="ghost">{copy.organize}</Button>
      <Modal.Backdrop isDismissable={false}>
        <Modal.Container size="md">
          <Modal.Dialog className="workspace-theme rounded-2xl">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{copy.organize}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <Tabs defaultSelectedKey="assignees">
                <Tabs.ListContainer>
                  <Tabs.List aria-label={copy.organize}>
                    <Tabs.Tab id="assignees">
                      {copy.assignees}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="projects">
                      {copy.projects}
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
                <Tabs.Panel id="assignees" className="pt-5">
                  <EntityManager
                    type="assignee"
                    snapshot={snapshot}
                    onSaved={onSaved}
                  />
                </Tabs.Panel>
                <Tabs.Panel id="projects" className="pt-5">
                  <EntityManager
                    type="project"
                    snapshot={snapshot}
                    onSaved={onSaved}
                  />
                </Tabs.Panel>
              </Tabs>
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
