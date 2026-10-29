'use client';

import { Button } from '@heroui/react';
import type { CSSProperties } from 'react';
import { WorkspaceIcon } from '@/components/workspace/workspace-icons';
import {
  NODE_HEIGHT,
  NODE_WIDTH,
  type GraphPosition,
  type GraphTask,
} from '@/components/workspace/graph-layout';

/**
 * Displays owner, title and state as one accessible graph target.
 * @param props - Record, world position, selection and activation callback; optional order bounds arrival delay.
 * @returns A HeroUI button; activation invokes onSelect without changing the task record.
 */
export function GraphNode({
  task,
  position,
  selected,
  related,
  onSelect,
  order = 0,
}: {
  task: GraphTask;
  position: GraphPosition;
  selected: boolean;
  related: boolean;
  onSelect: (id: string) => void;
  order?: number;
}) {
  return (
    <Button
      id={`task-node-${task.id}`}
      variant="ghost"
      className="graph-node"
      aria-pressed={selected}
      aria-label={`${task.title} · ${task.assignee} · ${task.status}${task.reviewer ? ` · ${task.reviewer}` : ''}`}
      onPress={() => onSelect(task.id)}
      style={
        {
          left: position.x,
          top: position.y,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          '--assignee-color': task.color,
          '--node-order': Math.min(order, 6),
        } as CSSProperties
      }
      data-related={related}
      data-complete={task.completed}
    >
      <span className="graph-node-owner-row">
        <span className="graph-assignee">
          <span className="graph-avatar" aria-hidden="true">
            {task.assignee.slice(0, 1).toLocaleUpperCase()}
          </span>
          <span className="truncate">{task.assignee}</span>
        </span>
        <WorkspaceIcon name="arrow" className="graph-node-open size-3.5" />
      </span>
      <span className="graph-node-title">{task.title}</span>
      <span className="graph-node-footer">
        <span
          className="graph-state"
          data-ready={task.ready}
          data-complete={task.completed}
        >
          {task.completed ? (
            <WorkspaceIcon name="check" className="size-3" />
          ) : (
            <span className="graph-state-dot" aria-hidden="true" />
          )}
          {task.status}
        </span>
        {task.reviewer ? (
          <span className="graph-node-reviewer" title={task.reviewer}>
            {task.reviewer}
          </span>
        ) : null}
      </span>
    </Button>
  );
}
