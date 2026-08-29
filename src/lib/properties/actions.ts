'use server';

import { requireAuthenticated } from '@/lib/auth/session';
import { propertyService } from '@/lib/properties';
import type {
  CreatePropertyInput,
  PropertyDefinition,
  ReorderPropertiesInput,
  SetTaskPropertyValueInput,
  TaskPropertyValueData,
  UpdatePropertyInput,
} from '@/lib/properties/types';
import {
  executeBoardAction,
  type ActionResult,
} from '@/lib/validation/action-result';

/** Creates one authenticated configurable property definition. */
export async function createPropertyAction(
  input: CreatePropertyInput,
): Promise<ActionResult<PropertyDefinition>> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    return propertyService.create(input);
  });
}

/** Updates one authenticated property definition. */
export async function updatePropertyAction(
  input: UpdatePropertyInput,
): Promise<ActionResult<PropertyDefinition>> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    return propertyService.update(input);
  });
}

/** Deletes one property definition and its values by cascade. */
export async function deletePropertyAction(id: string): Promise<ActionResult> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await propertyService.delete(id);
  });
}

/** Persists the complete order of configurable properties. */
export async function reorderPropertiesAction(
  input: ReorderPropertiesInput,
): Promise<ActionResult> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await propertyService.reorder(input);
  });
}

/** Sets one validated task property value. */
export async function setTaskPropertyValueAction(
  input: SetTaskPropertyValueInput,
): Promise<ActionResult<TaskPropertyValueData>> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    return propertyService.setValue(input);
  });
}

/** Deletes one task property value. */
export async function deleteTaskPropertyValueAction(
  taskId: string,
  propertyId: string,
): Promise<ActionResult> {
  return executeBoardAction(async () => {
    await requireAuthenticated();
    await propertyService.deleteValue(taskId, propertyId);
  });
}
