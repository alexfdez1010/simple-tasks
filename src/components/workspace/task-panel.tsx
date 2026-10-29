'use client';

import { Button, Drawer } from '@heroui/react';
import { useEffect, useState } from 'react';
import type { WorkspaceSnapshot } from '@/lib/coordination/snapshot';
import { WorkspaceTaskEditor } from '@/components/workspace/task-editor';
import { TaskInspection } from '@/components/workspace/task-inspection';
import { useWorkspaceCopy } from '@/components/workspace/copy';
import { WorkspaceIcon } from '@/components/workspace/workspace-icons';

type PanelProps = {
  id: string;
  snapshot: WorkspaceSnapshot;
  defaultProject: string;
  onClose: () => void;
  onSaved: () => void;
  onSelect: (id: string) => void;
};

/** Keeps read-only graph inspection nonmodal and protects task drafts inside the accessible editing drawer. */
export function WorkspaceTaskPanel({
  id,
  snapshot,
  defaultProject,
  onClose,
  onSaved,
  onSelect,
}: PanelProps) {
  const task = snapshot.tasks.find((candidate) => candidate.id === id);
  const copy = useWorkspaceCopy();
  const [editing, setEditing] = useState(id === 'new');
  const [pending, setPending] = useState(false);
  /** Dismisses the inspector and restores focus to the initiating task when it still exists. */
  function close() {
    onClose();
    requestAnimationFrame(() =>
      (
        document.getElementById(`task-node-${id}`) ??
        document.getElementById('new-task')
      )?.focus(),
    );
  }
  useEffect(() => {
    if (!editing) document.getElementById('task-panel-heading')?.focus();
  }, [id, editing]);
  useEffect(() => {
    /** Leaves nested confirmation dialogs in control of their own Escape handling. */
    function escape(event: KeyboardEvent) {
      if (
        !editing &&
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        !document.querySelector('[role="alertdialog"]')
      ) {
        onClose();
        requestAnimationFrame(() =>
          (
            document.getElementById(`task-node-${id}`) ??
            document.getElementById('new-task')
          )?.focus(),
        );
      }
    }
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [editing, id, onClose]);
  if (!editing)
    return (
      <aside
        className="workspace-detail"
        aria-label={task?.title ?? copy.missing}
        data-testid="task-panel"
      >
        <header className="workspace-detail-header">
          <h2 id="task-panel-heading" tabIndex={-1}>
            {task?.title ?? copy.missing}
          </h2>
          <Button
            variant="ghost"
            isIconOnly
            aria-label={copy.close}
            onPress={close}
          >
            <WorkspaceIcon name="close" className="size-5" />
          </Button>
        </header>
        {task ? (
          <TaskInspection
            task={task}
            onSaved={onSaved}
            onSelect={onSelect}
            onEdit={() => setEditing(true)}
          />
        ) : (
          <p>{copy.missing}</p>
        )}
      </aside>
    );
  return (
    <Drawer.Backdrop
      isDismissable={false}
      isKeyboardDismissDisabled={pending}
      isOpen
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Drawer.Content placement="right" className="task-drawer-content">
        <Drawer.Dialog
          className="task-drawer-dialog workspace-theme"
          data-testid="task-panel"
        >
          <Drawer.CloseTrigger isDisabled={pending} />
          <Drawer.Header>
            <Drawer.Heading>
              {id === 'new' ? copy.newTask : (task?.title ?? copy.missing)}
            </Drawer.Heading>
          </Drawer.Header>
          <Drawer.Body>
            <WorkspaceTaskEditor
              task={task}
              snapshot={snapshot}
              defaultProject={defaultProject}
              onSaved={onSaved}
              onCancel={close}
              onPendingChange={setPending}
            />
          </Drawer.Body>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}
