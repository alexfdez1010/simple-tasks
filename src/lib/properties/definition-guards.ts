import { Prisma, type TaskPropertyType } from '@/generated/prisma';
import { conflict } from '@/lib/validation/errors';
import { parsePropertyValue } from '@/lib/validation/properties';

/** Rewrites definition positions to a contiguous zero-based sequence. */
export async function resequenceProperties(
  transaction: Prisma.TransactionClient,
  propertyIds: string[],
): Promise<void> {
  for (const [position, id] of propertyIds.entries()) {
    await transaction.taskPropertyDefinition.update({
      where: { id },
      data: { position },
    });
  }
}

/** Rejects definition changes that would reinterpret persisted values. */
export async function assertCompatiblePropertyChange(
  transaction: Prisma.TransactionClient,
  propertyId: string,
  currentType: TaskPropertyType,
  nextType: TaskPropertyType,
  nextOptions: string[],
): Promise<void> {
  const values = await transaction.taskPropertyValue.findMany({
    where: { propertyId },
    select: { value: true },
  });
  if (values.length > 0 && currentType !== nextType)
    throw conflict('Borra los valores antes de cambiar el tipo de propiedad.');
  try {
    for (const item of values)
      parsePropertyValue(nextType, nextOptions, item.value);
  } catch {
    throw conflict('Las opciones nuevas eliminarían valores que están en uso.');
  }
}

/** Maps database uniqueness failures to a stable property-name conflict. */
export function rethrowUniquePropertyName(error: unknown): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw conflict('Ya existe una propiedad con ese nombre.');
  }
  throw error;
}
