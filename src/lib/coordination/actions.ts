'use server';

import { requireAuthenticated } from '@/lib/auth/session';
import { coordinationService } from '@/lib/coordination';
import { executeBoardAction } from '@/lib/validation/action-result';
import type { z } from 'zod';
import type {
  assigneeFields,
  deleteProjectSchema,
  projectFields,
  updateAssigneeSchema,
  updateProjectSchema,
} from '@/lib/coordination/schemas';

/** Creates a responsible party from an authenticated human form. */
export async function createAssigneeAction(
  input: z.input<typeof assigneeFields>,
) {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    return { id: (await coordinationService.createAssignee(input)).id };
  });
}
/** Updates a persisted responsible party from the management panel. */
export async function updateAssigneeAction(
  input: z.input<typeof updateAssigneeSchema>,
) {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await coordinationService.updateAssignee(input);
  });
}
/** Creates a project without adding demonstration tasks. */
export async function createProjectAction(
  input: z.input<typeof projectFields>,
) {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    return { id: (await coordinationService.createProject(input)).id };
  });
}
/** Updates project context while preserving its task references. */
export async function updateProjectAction(
  input: z.input<typeof updateProjectSchema>,
) {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await coordinationService.updateProject(input);
  });
}
/** Deletes a project for an authenticated operator, preserving its tasks in the selected destination. */
export async function deleteProjectAction(
  input: z.input<typeof deleteProjectSchema>,
) {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await coordinationService.deleteProject(input);
  });
}
