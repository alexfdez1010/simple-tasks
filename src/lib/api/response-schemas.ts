import { z } from 'zod';
const id = z.string();
const timestamp = z.string().datetime();
const value = z.union([z.string(), z.number(), z.array(z.string())]);
const status = z.object({
  id,
  name: z.string(),
  color: z.string(),
  position: z.number().int(),
  isTerminal: z.boolean(),
});
const property = z.object({
  id,
  name: z.string(),
  type: z.enum(['TEXT', 'NUMBER', 'DATE', 'SELECT', 'MULTI_SELECT']),
  position: z.number().int(),
  options: z.array(z.string()),
});
const propertyValue = z.object({ propertyId: id, value });
const task = z.object({
  id,
  title: z.string(),
  description: z.string().nullable(),
  statusId: id,
  position: z.number().int(),
  dueDate: timestamp.nullable(),
  completedAt: timestamp.nullable(),
  createdAt: timestamp,
  updatedAt: timestamp,
  status,
  propertyValues: z.array(propertyValue),
});

export const responseSchemas = {
  Task: z.object({ data: task }),
  Status: z.object({ data: status }),
  Property: z.object({ data: property }),
  PropertyValue: z.object({ data: propertyValue }),
  Statuses: z.object({ data: z.array(status) }),
  Properties: z.object({ data: z.array(property) }),
  TasksPage: z.object({
    data: z.array(task),
    pagination: z.object({
      limit: z.number().int(),
      hasMore: z.boolean(),
      nextCursor: z.string().nullable(),
    }),
  }),
  Error: z.object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      requestId: z.string(),
      details: z
        .array(z.object({ path: z.string(), message: z.string() }))
        .optional(),
    }),
  }),
};
