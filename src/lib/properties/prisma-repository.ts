import type { PrismaClient } from '@/generated/prisma';
import { runSerializable } from '@/lib/db/transaction';
import {
  assertCompatiblePropertyChange,
  resequenceProperties,
  rethrowUniquePropertyName,
} from '@/lib/properties/definition-guards';
import type { PropertyRepository } from '@/lib/properties/repository';
import {
  deserializeOptions,
  serializeProperty,
} from '@/lib/properties/serialization';
import { MAX_TASK_PROPERTIES } from '@/lib/properties/limits';
import type {
  CreatePropertyInput,
  PropertyDefinition,
  ReorderPropertiesInput,
  SetTaskPropertyValueInput,
  TaskPropertyValueData,
  UpdatePropertyInput,
} from '@/lib/properties/types';
import { persistTaskPropertyValues } from '@/lib/properties/value-persistence';
import { conflict, notFound } from '@/lib/validation/errors';
import {
  createPropertySchema,
  isSelectableProperty,
} from '@/lib/validation/properties';

/** Prisma-backed configurable-property persistence. */
export class PrismaPropertyRepository implements PropertyRepository {
  /** Injects the process-level Prisma client. */
  constructor(private readonly client: PrismaClient) {}

  /** Lists definitions in stable display order. */
  async list(): Promise<PropertyDefinition[]> {
    const properties = await this.client.taskPropertyDefinition.findMany({
      orderBy: [{ position: 'asc' }, { id: 'asc' }],
    });
    return properties.map(serializeProperty);
  }

  /** Appends a definition atomically. */
  async create(input: CreatePropertyInput): Promise<PropertyDefinition> {
    try {
      const property = await runSerializable(
        this.client,
        async (transaction) => {
          const propertyCount =
            await transaction.taskPropertyDefinition.count();
          if (propertyCount >= MAX_TASK_PROPERTIES) {
            throw conflict(
              `El tablero admite como máximo ${MAX_TASK_PROPERTIES} propiedades.`,
            );
          }
          const aggregate = await transaction.taskPropertyDefinition.aggregate({
            _max: { position: true },
          });
          return transaction.taskPropertyDefinition.create({
            data: {
              ...input,
              options: input.options ?? [],
              position: (aggregate._max.position ?? -1) + 1,
            },
          });
        },
      );
      return serializeProperty(property);
    } catch (error) {
      rethrowUniquePropertyName(error);
    }
  }

  /** Updates a definition while protecting values from incompatible changes. */
  async update(input: UpdatePropertyInput): Promise<PropertyDefinition> {
    try {
      const property = await runSerializable(
        this.client,
        async (transaction) => {
          const current = await transaction.taskPropertyDefinition.findUnique({
            where: { id: input.id },
          });
          if (!current) throw notFound('La propiedad');
          const nextType = input.type ?? current.type;
          const currentOptions = deserializeOptions(current.options);
          const nextOptions =
            input.options ??
            (isSelectableProperty(nextType) ? currentOptions : []);
          createPropertySchema.parse({
            name: input.name ?? current.name,
            type: nextType,
            options: nextOptions,
          });
          await assertCompatiblePropertyChange(
            transaction,
            current.id,
            current.type,
            nextType,
            nextOptions,
          );
          return transaction.taskPropertyDefinition.update({
            where: { id: current.id },
            data: { name: input.name, type: input.type, options: nextOptions },
          });
        },
      );
      return serializeProperty(property);
    } catch (error) {
      rethrowUniquePropertyName(error);
    }
  }

  /** Deletes a definition; relational values cascade in the database. */
  async delete(id: string): Promise<void> {
    await runSerializable(this.client, async (transaction) => {
      const result = await transaction.taskPropertyDefinition.deleteMany({
        where: { id },
      });
      if (result.count === 0) throw notFound('La propiedad');
      const remaining = await transaction.taskPropertyDefinition.findMany({
        orderBy: { position: 'asc' },
        select: { id: true },
      });
      await resequenceProperties(
        transaction,
        remaining.map((item) => item.id),
      );
    });
  }

  /** Applies an exact complete ordering after membership validation. */
  async reorder(input: ReorderPropertiesInput): Promise<void> {
    await runSerializable(this.client, async (transaction) => {
      const rows = await transaction.taskPropertyDefinition.findMany({
        select: { id: true },
      });
      const expected = rows.map((item) => item.id).sort();
      const received = [...new Set(input.propertyIds)].sort();
      if (
        expected.length !== received.length ||
        expected.some((id, index) => id !== received[index])
      ) {
        throw conflict(
          'El orden debe incluir exactamente todas las propiedades.',
        );
      }
      await resequenceProperties(transaction, input.propertyIds);
    });
  }

  /** Validates and upserts one value atomically. */
  async setValue(
    input: SetTaskPropertyValueInput,
  ): Promise<TaskPropertyValueData> {
    return runSerializable(this.client, async (transaction) => {
      if (!(await transaction.task.findUnique({ where: { id: input.taskId } })))
        throw notFound('La tarea');
      const [value] = await persistTaskPropertyValues(
        transaction,
        input.taskId,
        [input],
        false,
      );
      return value;
    });
  }

  /** Deletes one task value without affecting its definition. */
  async deleteValue(taskId: string, propertyId: string): Promise<void> {
    const result = await this.client.taskPropertyValue.deleteMany({
      where: { taskId, propertyId },
    });
    if (result.count === 0) throw notFound('El valor de la propiedad');
  }
}
