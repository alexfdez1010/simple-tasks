'use server';

import { requireAuthenticated } from '@/lib/auth/session';
import { automationService } from '@/lib/automations';
import type {
  AutomationDefinition,
  CreateAutomationInput,
  UpdateAutomationInput,
} from '@/lib/automations/types';
import {
  executeBoardAction,
  type ActionResult,
} from '@/lib/validation/action-result';

/** Creates one authenticated transition automation. */
export async function createAutomationAction(
  input: CreateAutomationInput,
): Promise<ActionResult<AutomationDefinition>> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    return automationService.create(input);
  });
}

/** Updates one authenticated transition automation. */
export async function updateAutomationAction(
  input: UpdateAutomationInput,
): Promise<ActionResult<AutomationDefinition>> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    return automationService.update(input);
  });
}

/** Deletes one authenticated transition automation. */
export async function deleteAutomationAction(
  id: string,
): Promise<ActionResult> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await automationService.delete(id);
  });
}
