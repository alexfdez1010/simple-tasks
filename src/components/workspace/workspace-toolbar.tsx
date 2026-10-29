'use client';

import { Button, Checkbox, Input, TextField } from '@heroui/react';
import { StatisticSelect } from '@/components/statistics/statistic-select';
import { WorkspaceIcon } from '@/components/workspace/workspace-icons';
import { useWorkspaceCopy } from '@/components/workspace/copy';

type ToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  assigneeId: string;
  assignees: { id: string; name: string }[];
  onAssigneeChange: (value: string) => void;
  showCompleted: boolean;
  onCompletedChange: (value: boolean) => void;
  seconds: number;
  onSecondsChange: (value: number) => void;
  onRefresh: () => void;
};

/** Keeps search, owner, completion and synchronization controls independently labelled and keyboard accessible. */
export function WorkspaceToolbar(props: ToolbarProps) {
  const copy = useWorkspaceCopy();
  return (
    <div className="workspace-toolbar">
      <TextField
        className="workspace-search"
        aria-label={copy.search}
        value={props.search}
        onChange={props.onSearchChange}
      >
        <WorkspaceIcon name="search" />
        <Input placeholder={copy.search} />
      </TextField>
      <div className="workspace-assignee-select">
        <StatisticSelect
          label={copy.assignee}
          value={props.assigneeId}
          onChange={props.onAssigneeChange}
          options={[
            { id: 'all', label: copy.allAssignees },
            ...props.assignees.map((owner) => ({
              id: owner.id,
              label: owner.name,
            })),
          ]}
        />
      </div>
      <Checkbox
        isSelected={props.showCompleted}
        onChange={props.onCompletedChange}
      >
        <Checkbox.Content>
          <Checkbox.Control>
            <Checkbox.Indicator />
          </Checkbox.Control>
          {copy.showCompleted}
        </Checkbox.Content>
      </Checkbox>
      <div className="workspace-sync">
        <div className="workspace-interval-select">
          <StatisticSelect
            label={copy.sync}
            value={String(props.seconds)}
            onChange={(value) => props.onSecondsChange(Number(value))}
            options={[
              { id: '0', label: copy.paused },
              { id: '15', label: '15 s' },
              { id: '30', label: '30 s' },
              { id: '60', label: '60 s' },
            ]}
          />
        </div>
        <Button
          variant="ghost"
          aria-label={copy.refresh}
          onPress={props.onRefresh}
        >
          <WorkspaceIcon name="refresh" />
          <span className="workspace-refresh-label">{copy.refresh}</span>
        </Button>
      </div>
    </div>
  );
}
