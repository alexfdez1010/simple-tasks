import type { TaskPropertyValueInput } from '@/lib/properties/types';

/** Identifies the legacy assignment property independently of display language and case. */
export function isAssignmentProperty(name: string): boolean {
  return ['responsable', 'assignee'].includes(name.toLowerCase());
}

/** Removes legacy ownership mirrors from editable custom values; assignment has its own required field. */
export function customTaskValues(
  values: TaskPropertyValueInput[],
  definitions: { id: string; name: string }[],
): TaskPropertyValueInput[] {
  const legacy = new Set(
    definitions
      .filter((property) => isAssignmentProperty(property.name))
      .map((property) => property.id),
  );
  return values.filter((value) => !legacy.has(value.propertyId));
}
