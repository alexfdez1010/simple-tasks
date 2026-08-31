import { z } from 'zod';

import { MAX_TASK_PROPERTIES } from '@/lib/properties/limits';
import { taskPropertyValueInputSchema } from '@/lib/validation/properties';
import { idSchema } from '@/lib/validation/common';

const propertyValueSchema = z.union([
  z.string().trim().max(20_000),
  z.number().finite(),
  z.array(z.string().trim().min(1).max(80)).max(100),
]);

export const automationSchema = z
  .object({
    id: idSchema.optional(),
    name: z.string().trim().min(1).max(120),
    triggerType: z
      .enum(['STATUS_CHANGE', 'SCHEDULED'])
      .default('STATUS_CHANGE'),
    triggerStatusId: idSchema.nullable().optional(),
    scheduledAt: z.string().datetime().nullable().optional(),
    actionType: z.enum([
      'SET_COMPLETION_DATE_TODAY',
      'SET_PROPERTY_VALUE',
      'CREATE_TASK',
    ]),
    propertyId: idSchema.nullable().optional(),
    propertyValue: propertyValueSchema.nullable().optional(),
    taskTitleTemplate: z.string().trim().min(1).max(160).nullable().optional(),
    taskDescriptionTemplate: z.string().max(20_000).nullable().optional(),
    taskStatusId: idSchema.nullable().optional(),
    taskDueDateOffsetDays: z
      .number()
      .int()
      .min(-3650)
      .max(3650)
      .nullable()
      .optional(),
    taskPropertyValues: z
      .array(taskPropertyValueInputSchema)
      .max(MAX_TASK_PROPERTIES)
      .optional(),
  })
  .superRefine((input, context) => {
    const isStatusChange = input.triggerType === 'STATUS_CHANGE';
    const hasProperty = Boolean(
      input.propertyId && input.propertyValue != null,
    );
    if (isStatusChange && !input.triggerStatusId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Status transitions require a trigger status.',
        path: ['triggerStatusId'],
      });
    }
    if (!isStatusChange && !input.scheduledAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Scheduled automations require a date.',
        path: ['scheduledAt'],
      });
    }
    if (input.actionType === 'SET_PROPERTY_VALUE' && !hasProperty) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Property actions require a property and a value.',
        path: ['propertyId'],
      });
    }
    if (input.actionType === 'SET_COMPLETION_DATE_TODAY' && hasProperty) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Completion-date actions cannot include a property value.',
        path: ['propertyId'],
      });
    }
    if (isStatusChange && input.actionType === 'CREATE_TASK') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Task creation actions require a scheduled trigger.',
        path: ['actionType'],
      });
    }
    if (!isStatusChange && input.actionType !== 'CREATE_TASK') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Scheduled automations create tasks.',
        path: ['actionType'],
      });
    }
    if (input.actionType === 'CREATE_TASK') {
      if (!input.taskTitleTemplate?.trim()) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Task creation actions require a title template.',
          path: ['taskTitleTemplate'],
        });
      }
      if (!input.taskStatusId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Task creation actions require a destination status.',
          path: ['taskStatusId'],
        });
      }
    }
    if (input.actionType !== 'SET_PROPERTY_VALUE' && hasProperty) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'This action cannot include a property value.',
        path: ['propertyId'],
      });
    }
  });
