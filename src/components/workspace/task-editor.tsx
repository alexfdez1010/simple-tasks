'use client';

import { Input, Label, TextArea, TextField } from '@heroui/react';
import { useState } from 'react';
import { createTaskAction, updateTaskAction } from '@/lib/tasks/actions';
import type {
  WorkspaceSnapshot,
  WorkspaceTask,
} from '@/lib/coordination/snapshot';
import { StatisticSelect } from '@/components/statistics/statistic-select';
import { DependencyPicker } from '@/components/workspace/dependency-picker';
import { DatePickerField } from '@/components/board/date-picker-field';
import { TaskPropertyFields } from '@/components/board/task-property-fields';
import {
  customTaskValues,
  isAssignmentProperty,
} from '@/lib/coordination/assignment-property';
import { TaskEditorFooter } from '@/components/workspace/task-editor-footer';
import { useWorkspaceCopy } from '@/components/workspace/copy';

/** Edits one task draft independently of polled snapshots, preserving typed content on errors. */
export function WorkspaceTaskEditor({
  task,
  snapshot,
  defaultProject,
  onSaved,
  onCancel,
  onPendingChange,
}: {
  task?: WorkspaceTask;
  snapshot: WorkspaceSnapshot;
  defaultProject: string;
  onSaved: () => void;
  onCancel: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const copy = useWorkspaceCopy();
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId ?? '');
  const [reviewerId, setReviewerId] = useState(task?.reviewerId ?? 'none');
  const [projectId, setProjectId] = useState(task?.projectId ?? defaultProject);
  const [statusId, setStatusId] = useState(
    task?.statusId ??
      snapshot.statuses.find(
        (status) => !status.isTerminal && status.workType === 'READY',
      )?.id ??
      snapshot.statuses[0]?.id ??
      '',
  );
  const [dependencyIds, setDependencyIds] = useState(task?.dependencyIds ?? []);
  const [dueDate, setDueDate] = useState(task?.dueDate ?? '');
  const [propertyValues, setPropertyValues] = useState(
    task?.propertyValues ?? [],
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version] = useState(task?.updatedAt);
  const [taskId] = useState(task?.id);
  const current = snapshot.tasks.find((candidate) => candidate.id === taskId);
  const deleted = Boolean(taskId && !current);
  const changed = Boolean(taskId && current && current.updatedAt !== version);
  /** Saves an explicitly assigned task, checking the draft version before attempting an edit. */
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!assigneeId || !projectId || !title.trim()) return;
    if (deleted) {
      setError(copy.missing);
      return;
    }
    if (changed) {
      setError(copy.changed);
      return;
    }
    setPending(true);
    onPendingChange?.(true);
    setError(null);
    try {
      const fields = {
        title,
        description,
        assigneeId,
        reviewerId: reviewerId === 'none' ? null : reviewerId,
        projectId,
        dependencyIds,
        dueDate: dueDate || null,
        propertyValues: customTaskValues(propertyValues, snapshot.properties),
      };
      const result = taskId
        ? await updateTaskAction({
            ...fields,
            id: taskId,
            statusId,
            index: 0,
            expectedUpdatedAt: version,
          })
        : await createTaskAction({ ...fields, statusId });
      if (result.success) onSaved();
      else setError(result.error);
    } catch {
      setError(copy.saveFailed);
    } finally {
      setPending(false);
      onPendingChange?.(false);
    }
  }
  return (
    <form className="workspace-detail-fields" onSubmit={submit}>
      <TextField isRequired value={title} onChange={setTitle}>
        <Label>{copy.title}</Label>
        <Input autoFocus maxLength={160} />
      </TextField>
      <StatisticSelect
        label={copy.assignee}
        value={assigneeId || null}
        onChange={setAssigneeId}
        options={snapshot.assignees.map((owner) => ({
          id: owner.id,
          label: owner.name,
        }))}
      />
      <StatisticSelect
        label={copy.project}
        value={projectId || null}
        onChange={setProjectId}
        options={snapshot.projects.map((project) => ({
          id: project.id,
          label: project.name,
        }))}
      />
      <StatisticSelect
        label={copy.reviewer}
        value={reviewerId}
        onChange={setReviewerId}
        options={[
          { id: 'none', label: copy.noReviewer },
          ...snapshot.assignees
            .filter((owner) => owner.id !== assigneeId)
            .map((owner) => ({ id: owner.id, label: owner.name })),
        ]}
      />
      <TextField value={description} onChange={setDescription}>
        <Label>{copy.description}</Label>
        <TextArea maxLength={20_000} rows={5} />
      </TextField>
      <StatisticSelect
        label={copy.status}
        value={statusId}
        onChange={setStatusId}
        options={snapshot.statuses.map((status) => ({
          id: status.id,
          label: status.name,
        }))}
      />
      <DependencyPicker
        tasks={snapshot.tasks}
        taskId={task?.id}
        selected={dependencyIds}
        onChange={setDependencyIds}
      />
      <DatePickerField
        label={copy.dueDate}
        name="dueDate"
        value={dueDate}
        onChange={setDueDate}
      />
      <TaskPropertyFields
        properties={snapshot.properties.filter(
          (property) => !isAssignmentProperty(property.name),
        )}
        values={propertyValues}
        onChange={setPropertyValues}
      />
      <TaskEditorFooter
        pending={pending}
        disabled={
          !title.trim() || !assigneeId || !projectId || changed || deleted
        }
        warning={deleted ? copy.missing : changed ? copy.changed : null}
        error={error}
        onCancel={onCancel}
      />
    </form>
  );
}
