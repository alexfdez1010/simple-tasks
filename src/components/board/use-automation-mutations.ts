'use client';

import type { Dispatch, SetStateAction } from 'react';

import type {
  AutomationDefinition,
  AutomationValues,
  MutationResult,
} from '@/components/board/types';
import {
  createAutomationAction,
  deleteAutomationAction,
  updateAutomationAction,
} from '@/lib/automations/actions';

interface AutomationMutationOptions {
  automations: AutomationDefinition[];
  setAutomations: Dispatch<SetStateAction<AutomationDefinition[]>>;
  refresh: () => void;
}

/** Provides optimistic create, edit, and delete automation operations. */
export function useAutomationMutations({
  automations,
  setAutomations,
  refresh,
}: AutomationMutationOptions) {
  /** Adds a temporary rule and reconciles it with the persisted result. */
  async function create(values: AutomationValues): Promise<MutationResult> {
    const snapshot = structuredClone(automations);
    const optimisticId = `optimistic-${crypto.randomUUID()}`;
    setAutomations([...snapshot, { id: optimisticId, ...values }]);
    const result = await createAutomationAction(values);
    if (!result.success) setAutomations(snapshot);
    else {
      const saved = result.data as AutomationDefinition | undefined;
      if (saved) {
        setAutomations((current) =>
          current.map((item) => (item.id === optimisticId ? saved : item)),
        );
      }
      refresh();
    }
    return result;
  }

  /** Replaces one rule optimistically and rolls back if persistence fails. */
  async function update(
    id: string,
    values: AutomationValues,
  ): Promise<MutationResult> {
    const snapshot = structuredClone(automations);
    setAutomations(
      snapshot.map((item) => (item.id === id ? { ...item, ...values } : item)),
    );
    const result = await updateAutomationAction({ id, ...values });
    if (!result.success) setAutomations(snapshot);
    else {
      const saved = result.data as AutomationDefinition | undefined;
      if (saved) {
        setAutomations((current) =>
          current.map((item) => (item.id === id ? saved : item)),
        );
      }
      refresh();
    }
    return result;
  }

  /** Removes a rule optimistically and restores it after a failed request. */
  async function remove(id: string): Promise<MutationResult> {
    const snapshot = structuredClone(automations);
    setAutomations(snapshot.filter((item) => item.id !== id));
    const result = await deleteAutomationAction(id);
    if (!result.success) setAutomations(snapshot);
    else refresh();
    return result;
  }

  return { create, update, remove };
}
