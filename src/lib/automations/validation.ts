import { z } from 'zod';

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
    triggerStatusId: idSchema,
    actionType: z.enum(['SET_COMPLETION_DATE_TODAY', 'SET_PROPERTY_VALUE']),
    propertyId: idSchema.nullable().optional(),
    propertyValue: propertyValueSchema.nullable().optional(),
  })
  .superRefine((input, context) => {
    const hasProperty = Boolean(
      input.propertyId && input.propertyValue != null,
    );
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
  });
