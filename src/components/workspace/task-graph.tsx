'use client';
import { Button } from '@heroui/react';
import { GraphNode } from '@/components/workspace/graph-node';
import { useId, useMemo } from 'react';
import {
  layoutGraph,
  NODE_HEIGHT,
  NODE_WIDTH,
  type GraphProject,
  type GraphTask,
} from '@/components/workspace/graph-layout';
import { useGraphCamera } from '@/components/workspace/use-graph-camera';
type GraphLabels = {
  graph: string;
  zoomIn: string;
  zoomOut: string;
  fit: string;
  empty: string;
};
/** Renders actual directed dependencies with keyboard-accessible task nodes and a pannable viewport. */
export function TaskGraph({
  tasks,
  projects,
  selectedId,
  onSelect,
  scope,
  labels,
}: {
  tasks: GraphTask[];
  projects: GraphProject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  scope: string;
  labels: GraphLabels;
}) {
  const layout = useMemo(() => layoutGraph(tasks, projects), [tasks, projects]);
  const {
    container: containerRef,
    camera,
    fit,
    zoom,
    pointerDown,
    pointerMove,
    pointerUp,
  } = useGraphCamera(
    layout.width,
    layout.height,
    `${scope}-${tasks.length > 0}`,
    [...layout.positions.values()].sort(
      (a, b) => a.y - b.y || a.x - b.x,
    )[0] ?? { x: 0, y: 0 },
  );
  const marker = useId().replaceAll(':', '');
  const related = new Set(
    tasks.find((task) => task.id === selectedId)?.dependencyIds ?? [],
  );
  tasks
    .filter((task) => task.dependencyIds.includes(selectedId ?? ''))
    .forEach((task) => related.add(task.id));
  return (
    <section className="task-graph" aria-label={labels.graph}>
      <div
        className="graph-viewport"
        ref={containerRef}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onLostPointerCapture={pointerUp}
      >
        {tasks.length ? (
          <div
            className="graph-world"
            style={{
              width: layout.width,
              height: layout.height,
              transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`,
            }}
          >
            <svg
              className="graph-edges"
              width={layout.width}
              height={layout.height}
              aria-hidden="true"
            >
              <defs>
                <marker
                  id={marker}
                  viewBox="0 0 8 8"
                  refX="7"
                  refY="4"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path
                    d="M 0 1 L 7 4 L 0 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                </marker>
              </defs>
              {tasks.flatMap((task) =>
                task.dependencyIds.map((parent) => {
                  const from = layout.positions.get(parent);
                  const to = layout.positions.get(task.id);
                  if (!from || !to) return null;
                  const x1 = from.x + NODE_WIDTH;
                  const y1 = from.y + NODE_HEIGHT / 2;
                  const x2 = to.x - 3;
                  const y2 = to.y + NODE_HEIGHT / 2;
                  const active =
                    selectedId === task.id || selectedId === parent;
                  return (
                    <path
                      key={`${parent}-${task.id}`}
                      d={`M${x1},${y1} C${x1 + 40},${y1} ${x2 - 40},${y2} ${x2},${y2}`}
                      className={
                        active ? 'graph-edge graph-edge-active' : 'graph-edge'
                      }
                      markerEnd={`url(#${marker})`}
                    />
                  );
                }),
              )}
            </svg>
            {layout.lanes.map((lane) => (
              <div
                className="graph-project-label"
                style={{ top: lane.y, left: 40 }}
                key={lane.id}
              >
                {lane.name}
              </div>
            ))}
            {tasks.map((task) => {
              const position = layout.positions.get(task.id);
              return position ? (
                <GraphNode
                  key={task.id}
                  task={task}
                  position={position}
                  selected={selectedId === task.id}
                  related={related.has(task.id)}
                  onSelect={onSelect}
                />
              ) : null;
            })}
          </div>
        ) : (
          <p className="graph-empty">{labels.empty}</p>
        )}
      </div>
      <div className="graph-controls">
        <Button
          variant="ghost"
          isIconOnly
          aria-label={labels.zoomOut}
          onPress={() => zoom(0.8)}
        >
          −
        </Button>
        <span className="text-xs tabular-nums">
          {Math.round(camera.scale * 100)}%
        </span>
        <Button
          variant="ghost"
          isIconOnly
          aria-label={labels.zoomIn}
          onPress={() => zoom(1.25)}
        >
          +
        </Button>
        <Button variant="ghost" onPress={() => fit()}>
          {labels.fit}
        </Button>
      </div>
    </section>
  );
}
