import type { Task, TaskPropertyValue } from '@/generated/prisma';
import { serializeTaskPropertyValue } from '@/lib/properties/serialization';
import type { TaskWithProperties } from '@/lib/tasks/types';

/** Serializes the configurable values attached to a Prisma task row. */
export function serializeTaskWithProperties(
  task: Task & { propertyValues: TaskPropertyValue[] },
): TaskWithProperties {
  return {
    ...task,
    propertyValues: task.propertyValues.map(serializeTaskPropertyValue),
  };
}
