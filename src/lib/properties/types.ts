import type { TaskPropertyType } from '@/generated/prisma';

export type PropertyValue = string | number | string[];

export type PropertyDefinition = {
  id: string;
  name: string;
  type: TaskPropertyType;
  position: number;
  options: string[];
};

export type TaskPropertyValueInput = {
  propertyId: string;
  value: PropertyValue;
};

export type TaskPropertyValueData = TaskPropertyValueInput;

export type CreatePropertyInput = {
  name: string;
  type: TaskPropertyType;
  options?: string[];
};

export type UpdatePropertyInput = {
  id: string;
  name?: string;
  type?: TaskPropertyType;
  options?: string[];
};

export type ReorderPropertiesInput = { propertyIds: string[] };

export type SetTaskPropertyValueInput = TaskPropertyValueInput & {
  taskId: string;
};
