'use client';
import { Button } from '@heroui/react';
import {
  NODE_HEIGHT,
  NODE_WIDTH,
  type GraphPosition,
  type GraphTask,
} from '@/components/workspace/graph-layout';

/** Displays an accountable task and optional reviewer as one keyboard-accessible graph control. */
export function GraphNode({
  task,
  position,
  selected,
  related,
  onSelect,
}: {
  task: GraphTask;
  position: GraphPosition;
  selected: boolean;
  related: boolean;
  onSelect: (id: string) => void;
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
        } as React.CSSProperties
      }
      data-related={related}
      data-complete={task.completed}
    >
      <span className="graph-node-title">{task.title}</span>
      {task.reviewer ? (
        <span className="truncate text-[11px] text-muted">{task.reviewer}</span>
      ) : null}
      <span className="graph-node-footer">
        <span className="graph-assignee">
          <span className="graph-avatar" aria-hidden="true">
            {task.assignee.slice(0, 1).toLocaleUpperCase()}
          </span>
          <span className="truncate">{task.assignee}</span>
        </span>
        <span
          className="graph-state"
          data-ready={task.ready}
          data-complete={task.completed}
        >
          {task.status}
        </span>
      </span>
    </Button>
  );
}
