import type { PropertyRepository } from '@/lib/properties/repository';
import type {
  CreatePropertyInput,
  PropertyDefinition,
  ReorderPropertiesInput,
  SetTaskPropertyValueInput,
  TaskPropertyValueData,
  UpdatePropertyInput,
} from '@/lib/properties/types';
import { idSchema } from '@/lib/validation/common';
import {
  createPropertySchema,
  reorderPropertiesSchema,
  setTaskPropertyValueSchema,
  updatePropertySchema,
} from '@/lib/validation/properties';

/** Configurable-property use cases shared by UI and MCP transports. */
export class PropertyService {
  /** Injects the focused property persistence abstraction. */
  constructor(private readonly repository: PropertyRepository) {}

  /** Lists definitions in display order. */
  list(): Promise<PropertyDefinition[]> {
    return this.repository.list();
  }

  /** Validates and appends a definition. */
  create(input: CreatePropertyInput): Promise<PropertyDefinition> {
    return this.repository.create(createPropertySchema.parse(input));
  }

  /** Validates and safely updates a definition. */
  update(input: UpdatePropertyInput): Promise<PropertyDefinition> {
    return this.repository.update(updatePropertySchema.parse(input));
  }

  /** Deletes a definition and its task values. */
  delete(id: string): Promise<void> {
    return this.repository.delete(idSchema.parse(id));
  }

  /** Validates and applies the complete definition order. */
  reorder(input: ReorderPropertiesInput): Promise<void> {
    return this.repository.reorder(reorderPropertiesSchema.parse(input));
  }

  /** Validates and persists one task property value. */
  setValue(input: SetTaskPropertyValueInput): Promise<TaskPropertyValueData> {
    return this.repository.setValue(setTaskPropertyValueSchema.parse(input));
  }

  /** Deletes one task property value. */
  deleteValue(taskId: string, propertyId: string): Promise<void> {
    return this.repository.deleteValue(
      idSchema.parse(taskId),
      idSchema.parse(propertyId),
    );
  }
}
