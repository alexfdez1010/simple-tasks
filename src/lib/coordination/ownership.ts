import type { Prisma } from '@/generated/prisma';
import type { TaskPropertyValueInput } from '@/lib/properties/types';
import { conflict, notFound } from '@/lib/validation/errors';

export const LEGACY_ASSIGNEE_NAMES = ['responsable', 'assignee'];

/** Resolves legacy property assignments and explicit IDs to one canonical, non-null owner. */
export async function resolveAssignee(
  transaction: Prisma.TransactionClient,
  explicitId?: string,
  values: TaskPropertyValueInput[] = [],
  fallbackId = 'assignee-default',
): Promise<string> {
  const definitions = await transaction.taskPropertyDefinition.findMany({
    where: { id: { in: values.map((value) => value.propertyId) } },
  });
  const legacyIds = new Set(
    definitions
      .filter((property) =>
        LEGACY_ASSIGNEE_NAMES.includes(property.name.toLowerCase()),
      )
      .map((property) => property.id),
  );
  const legacy = values.filter((value) => legacyIds.has(value.propertyId));
  const names = [...new Set(legacy.map((value) => value.value))];
  if (names.length > 1)
    throw conflict('Provide one responsible party per task.');
  let legacyId: string | undefined;
  if (names.length) {
    const name = names[0];
    if (typeof name !== 'string' || !name.trim())
      throw conflict('Every task needs a responsible party.');
    const assignee = await transaction.assignee.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    legacyId = assignee.id;
  }
  const id = explicitId ?? legacyId ?? fallbackId;
  if (explicitId && legacyId && explicitId !== legacyId)
    throw conflict('The responsible party and legacy assignment must agree.');
  if (!(await transaction.assignee.findUnique({ where: { id } })))
    throw notFound('The responsible party');
  return id;
}

/** Keeps existing configurable assignment values usable by old clients and statistics after canonical edits. */
export async function mirrorLegacyAssignee(
  transaction: Prisma.TransactionClient,
  taskId: string,
  assigneeId: string,
): Promise<void> {
  const assignee = await transaction.assignee.findUniqueOrThrow({
    where: { id: assigneeId },
  });
  const properties = await transaction.taskPropertyDefinition.findMany();
  for (const property of properties) {
    if (
      !LEGACY_ASSIGNEE_NAMES.includes(property.name.toLowerCase()) ||
      !['SELECT', 'TEXT'].includes(property.type)
    )
      continue;
    if (property.type === 'SELECT') {
      const options = Array.isArray(property.options)
        ? property.options.filter(
            (option): option is string => typeof option === 'string',
          )
        : [];
      if (!options.includes(assignee.name))
        await transaction.taskPropertyDefinition.update({
          where: { id: property.id },
          data: { options: [...options, assignee.name] },
        });
    }
    await transaction.taskPropertyValue.upsert({
      where: { taskId_propertyId: { taskId, propertyId: property.id } },
      create: { taskId, propertyId: property.id, value: assignee.name },
      update: { value: assignee.name },
    });
  }
}
