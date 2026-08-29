import type { Prisma } from '@/generated/prisma';
import { deserializeOptions } from '@/lib/properties/serialization';
import type {
  TaskPropertyValueData,
  TaskPropertyValueInput,
} from '@/lib/properties/types';
import { conflict, notFound } from '@/lib/validation/errors';
import { parsePropertyValue } from '@/lib/validation/properties';

/** Validates and replaces or merges task property values inside a transaction. */
export async function persistTaskPropertyValues(
  transaction: Prisma.TransactionClient,
  taskId: string,
  inputs: TaskPropertyValueInput[],
  replaceExisting: boolean,
): Promise<TaskPropertyValueData[]> {
  const propertyIds = inputs.map((input) => input.propertyId);
  if (new Set(propertyIds).size !== propertyIds.length)
    throw conflict('Each property may appear only once.');
  const properties = await transaction.taskPropertyDefinition.findMany({
    where: { id: { in: propertyIds } },
  });
  if (properties.length !== propertyIds.length)
    throw notFound('One or more properties');
  const byId = new Map(properties.map((property) => [property.id, property]));
  const normalized = inputs.map((input) => {
    const property = byId.get(input.propertyId)!;
    return {
      propertyId: input.propertyId,
      value: parsePropertyValue(
        property.type,
        deserializeOptions(property.options),
        input.value,
      ),
    };
  });
  if (replaceExisting) {
    await transaction.taskPropertyValue.deleteMany({ where: { taskId } });
  }
  for (const input of normalized) {
    await transaction.taskPropertyValue.upsert({
      where: { taskId_propertyId: { taskId, propertyId: input.propertyId } },
      create: { taskId, propertyId: input.propertyId, value: input.value },
      update: { value: input.value },
    });
  }
  return normalized;
}
