import { describe, expect, it } from 'vitest';
import {
  assigneeFields,
  dependencyIdsSchema,
  readyQuery,
  updateAssigneeSchema,
} from '@/lib/coordination/schemas';
import {
  layoutGraph,
  NODE_WIDTH,
  type GraphTask,
} from '@/components/workspace/graph-layout';
import { filterGraphTasks } from '@/components/workspace/graph-filter';
import type { WorkspaceTask } from '@/lib/coordination/snapshot';

/** Builds a small graph fixture with stable IDs and explicit ownership. */
function node(
  id: string,
  dependencyIds: string[] = [],
  projectId = 'p',
): GraphTask {
  return {
    id,
    dependencyIds,
    projectId,
    title: id,
    assignee: 'Owner',
    color: '#7297CA',
    status: 'Ready',
    completed: false,
    ready: true,
  };
}

/** Supplies the subset of serialized task data exercised by graph filtering. */
function task(
  id: string,
  dependencyIds: string[],
  projectId: string,
  assigneeId: string,
  completed = false,
): WorkspaceTask {
  return {
    id,
    title: id,
    dependencyIds,
    projectId,
    assigneeId,
    status: { isTerminal: completed },
  } as WorkspaceTask;
}

describe('coordination contracts', () => {
  it('keeps agent identity dynamic and validates user-selected node colors', () => {
    expect(
      assigneeFields.parse({
        name: '  My agent  ',
        kind: 'AGENT',
        color: '#A1b2C3',
      }),
    ).toMatchObject({ name: 'My agent', color: '#A1b2C3' });
    expect(() =>
      assigneeFields.parse({ name: 'Agent', color: 'red' }),
    ).toThrow();
    expect(() => assigneeFields.parse({ name: ' ' })).toThrow();
  });
  it('preserves omitted fields on partial edits', () => {
    expect(updateAssigneeSchema.parse({ id: 'a', color: '#123456' })).toEqual({
      id: 'a',
      color: '#123456',
    });
  });
  it('bounds ready-work reads and rejects duplicate prerequisites', () => {
    expect(readyQuery.parse({ assigneeId: 'a' }).limit).toBe(20);
    expect(() => readyQuery.parse({ assigneeId: 'a', limit: 101 })).toThrow();
    expect(() => dependencyIdsSchema.parse(['a', 'a'])).toThrow();
  });
});

describe('dependency geometry', () => {
  it('places prerequisites before dependents and separates independent project lanes', () => {
    const graph = layoutGraph(
      [node('a'), node('b', ['a']), node('c', [], 'other')],
      [
        { id: 'p', name: 'One' },
        { id: 'other', name: 'Two' },
      ],
    );
    expect(graph.positions.get('b')!.x).toBeGreaterThan(
      graph.positions.get('a')!.x + NODE_WIDTH,
    );
    expect(graph.positions.get('c')!.y).toBeGreaterThan(
      graph.positions.get('a')!.y,
    );
    expect(graph.lanes).toHaveLength(2);
  });
  it('keeps siblings separate and places a merge after both parents', () => {
    const graph = layoutGraph(
      [node('a'), node('b', ['a']), node('c', ['a']), node('d', ['b', 'c'])],
      [{ id: 'p', name: 'One' }],
    );
    expect(graph.positions.get('b')!.y).not.toBe(graph.positions.get('c')!.y);
    expect(graph.positions.get('d')!.x).toBeGreaterThan(
      graph.positions.get('c')!.x,
    );
  });
  it('tolerates missing references and corrupt cycles without hanging the interface', () => {
    expect(
      layoutGraph([node('a', ['missing'])], [{ id: 'p', name: 'One' }])
        .positions.size,
    ).toBe(1);
    expect(
      layoutGraph(
        [node('a', ['b']), node('b', ['a'])],
        [{ id: 'p', name: 'One' }],
      ).positions.size,
    ).toBe(2);
    expect(layoutGraph([], []).width).toBeGreaterThan(0);
  });
});

describe('graph filtering', () => {
  it('retains completed and cross-project prerequisite ancestors as context', () => {
    const tasks = [
      task('root', [], 'other', 'human', true),
      task('middle', ['root'], 'p', 'agent'),
      task('leaf', ['middle'], 'p', 'agent'),
      task('unrelated', [], 'other', 'human'),
    ];
    const result = filterGraphTasks(tasks, {
      projectId: 'p',
      assigneeId: 'agent',
      search: 'leaf',
      showCompleted: false,
    });
    expect(result.map((item) => item.id)).toEqual(['root', 'middle', 'leaf']);
  });
  it('does not resurrect standalone completed work unless explicitly requested', () => {
    const tasks = [task('done', [], 'p', 'a', true)];
    expect(
      filterGraphTasks(tasks, {
        projectId: 'all',
        assigneeId: 'all',
        search: '',
        showCompleted: false,
      }),
    ).toEqual([]);
    expect(
      filterGraphTasks(tasks, {
        projectId: 'all',
        assigneeId: 'all',
        search: '',
        showCompleted: true,
      }),
    ).toHaveLength(1);
  });
});
