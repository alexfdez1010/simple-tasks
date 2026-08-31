'use client';

import type { Dispatch, SetStateAction } from 'react';

import { toAutomationInput } from '@/components/automations/automation-draft';
import type {
  AutomationDefinition,
  AutomationMutationResult,
  AutomationValues,
} from '@/components/automations/types';
import {
  createAutomationAction,
  deleteAutomationAction,
  updateAutomationAction,
} from '@/lib/automations/actions';

interface AutomationMutationOptions {
  setAutomations: Dispatch<SetStateAction<AutomationDefinition[]>>;
  refresh: () => void;
}

/** Provides server-reconciled automation commands without stale snapshots. */
export function useAutomationMutations({
  setAutomations,
  refresh,
}: AutomationMutationOptions) {
  /** Persists and appends one canonical automation definition. */
  async function create(
    values: AutomationValues,
  ): Promise<AutomationMutationResult> {
    const result = await createAutomationAction(toAutomationInput(values));
    const saved = result.success ? result.data : undefined;
    if (saved) {
      setAutomations((current) => [...current, saved]);
      refresh();
    }
    return result;
  }

  /** Persists and replaces one canonical automation definition. */
  async function update(
    id: string,
    values: AutomationValues,
  ): Promise<AutomationMutationResult> {
    const result = await updateAutomationAction({
      id,
      ...toAutomationInput(values),
    });
    const saved = result.success ? result.data : undefined;
    if (saved) {
      setAutomations((current) =>
        current.map((automation) =>
          automation.id === id ? saved : automation,
        ),
      );
      refresh();
    }
    return result;
  }

  /** Deletes one rule locally only after persistence succeeds. */
  async function remove(id: string): Promise<AutomationMutationResult> {
    const result = await deleteAutomationAction(id);
    if (result.success) {
      setAutomations((current) =>
        current.filter((automation) => automation.id !== id),
      );
      refresh();
    }
    return result;
  }

  return { create, update, remove };
}
