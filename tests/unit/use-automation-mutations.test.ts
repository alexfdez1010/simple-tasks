import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  AutomationDefinition,
  AutomationValues,
} from '@/components/automations/types';
import { useAutomationMutations } from '@/components/automations/use-automation-mutations';

const actions = vi.hoisted(() => ({
  create: vi.fn(),
  delete: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/automations/actions', () => ({
  createAutomationAction: actions.create,
  deleteAutomationAction: actions.delete,
  updateAutomationAction: actions.update,
}));

const VALUES: AutomationValues = {
  actionType: 'SET_COMPLETION_DATE_TODAY',
  name: 'Finish work',
  propertyId: null,
  propertyValue: null,
  scheduledAt: null,
  taskDescriptionTemplate: null,
  taskDueDateOffsetDays: null,
  taskPropertyValues: [],
  taskStatusId: null,
  taskTitleTemplate: null,
  triggerStatusId: 'done',
  triggerType: 'STATUS_CHANGE',
};

const AUTOMATION: AutomationDefinition = {
  ...VALUES,
  executedAt: null,
  id: 'automation-1',
};

describe('useAutomationMutations', () => {
  /** Resets isolated server-action spies before every mutation case. */
  beforeEach(() => vi.clearAllMocks());

  /** Appends only the canonical definition returned by successful persistence. */
  it('adds a created automation from the server response', async () => {
    actions.create.mockResolvedValue({ data: AUTOMATION, success: true });
    const setAutomations = vi.fn();
    const refresh = vi.fn();
    const mutations = useAutomationMutations({ setAutomations, refresh });

    await expect(mutations.create(VALUES)).resolves.toEqual({
      data: AUTOMATION,
      success: true,
    });
    const reconcile = setAutomations.mock.calls[0]?.[0] as (
      current: AutomationDefinition[],
    ) => AutomationDefinition[];
    expect(reconcile([])).toEqual([AUTOMATION]);
    expect(refresh).toHaveBeenCalledOnce();
  });

  /** Leaves the visible list unchanged when persistence rejects creation. */
  it('does not render a phantom automation after a failed create', async () => {
    actions.create.mockResolvedValue({ error: 'Failed', success: false });
    const setAutomations = vi.fn();
    const refresh = vi.fn();
    const mutations = useAutomationMutations({ setAutomations, refresh });

    await mutations.create(VALUES);

    expect(setAutomations).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  /** Replaces only the edited rule with the canonical server definition. */
  it('reconciles a successful update by identifier', async () => {
    const saved = { ...AUTOMATION, name: 'Updated' };
    actions.update.mockResolvedValue({ data: saved, success: true });
    const setAutomations = vi.fn();
    const mutations = useAutomationMutations({
      refresh: vi.fn(),
      setAutomations,
    });

    await mutations.update(AUTOMATION.id, { ...VALUES, name: 'Updated' });

    const reconcile = setAutomations.mock.calls[0]?.[0] as (
      current: AutomationDefinition[],
    ) => AutomationDefinition[];
    expect(reconcile([AUTOMATION])).toEqual([saved]);
  });

  /** Removes the rule only after the server confirms deletion. */
  it('keeps a rule visible when deletion fails', async () => {
    actions.delete.mockResolvedValue({ error: 'Failed', success: false });
    const setAutomations = vi.fn();
    const mutations = useAutomationMutations({
      refresh: vi.fn(),
      setAutomations,
    });

    await mutations.remove(AUTOMATION.id);

    expect(setAutomations).not.toHaveBeenCalled();
  });
});
