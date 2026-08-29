import type {
  CreatePropertyInput,
  PropertyDefinition,
  ReorderPropertiesInput,
  SetTaskPropertyValueInput,
  TaskPropertyValueData,
  UpdatePropertyInput,
} from '@/lib/properties/types';

/** Focused persistence contract for configurable task properties. */
export interface PropertyRepository {
  /** Lists property definitions in display order. */
  list(): Promise<PropertyDefinition[]>;
  /** Appends a validated property definition. */
  create(input: CreatePropertyInput): Promise<PropertyDefinition>;
  /** Updates a definition without invalidating persisted values. */
  update(input: UpdatePropertyInput): Promise<PropertyDefinition>;
  /** Deletes a definition and its values through database cascade. */
  delete(id: string): Promise<void>;
  /** Applies the exact complete property order. */
  reorder(input: ReorderPropertiesInput): Promise<void>;
  /** Validates and upserts one task property value. */
  setValue(input: SetTaskPropertyValueInput): Promise<TaskPropertyValueData>;
  /** Deletes one task property value. */
  deleteValue(taskId: string, propertyId: string): Promise<void>;
}
