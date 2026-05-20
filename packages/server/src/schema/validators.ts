import { API_KEY_SCOPES } from '@auto-cal/db/schema';
import { z } from 'zod';

export const CreateActivityTypeInput = z.object({
  name: z.string().min(1).max(100),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
    .default('#6366f1'),
});

export const UpdateActivityTypeInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
    .optional(),
});

export const CreateTodoListInput = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  activityTypeId: z.string().uuid(),
  defaultPriority: z.number().int().min(0).max(100).default(0),
  defaultEstimatedLength: z.number().int().min(0).max(1440).default(0),
});

export const UpdateTodoListInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).nullable().optional(),
  activityTypeId: z.string().uuid().optional(),
  defaultPriority: z.number().int().min(0).max(100).optional(),
  defaultEstimatedLength: z.number().int().min(0).max(1440).optional(),
});

export const CreateTodoInput = z.object({
  listId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.number().int().min(0).max(100).default(0),
  estimatedLength: z.number().int().min(1).max(1440).optional(),
  dueAt: z.string().datetime({ local: true }).nullable().optional(),
  scheduledAt: z.string().datetime({ local: true }).optional(),
});

export const UpdateTodoInput = z.object({
  id: z.string().uuid(),
  listId: z.string().uuid().optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  estimatedLength: z.number().int().min(1).max(1440).optional(),
  dueAt: z.string().nullable().optional(),
  scheduledAt: z.string().optional(),
  manuallyScheduled: z.boolean().optional(),
  completedAt: z.string().nullable().optional(),
});

export const CreateHabitInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priority: z.number().int().min(0).max(100).default(0),
  estimatedLength: z.number().int().min(1).max(1440).optional(),
  activityTypeId: z.string().uuid(),
  frequencyCount: z.number().int().positive().min(1).max(30),
  frequencyUnit: z.enum(['week', 'month'] as const),
  minTimeBetweenInstances: z.number().int().min(0).optional(),
});

export const UpdateHabitInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  estimatedLength: z.number().int().min(1).max(1440).optional(),
  activityTypeId: z.string().uuid().optional(),
});

export const CreateTimeBlockInput = z
  .object({
    activityTypeId: z.string().uuid(),
    daysOfWeek: z
      .array(z.number().int().min(0).max(6))
      .min(1)
      .max(7)
      .refine((days) => new Set(days).size === days.length, {
        message: 'Days of week must be unique',
      }),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    priority: z.number().int().min(0).max(100).default(0),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'End time must be after start time',
    path: ['endTime'],
  });

export const UpdateTimeBlockInput = z.object({
  id: z.string().uuid(),
  activityTypeId: z.string().uuid().optional(),
  daysOfWeek: z
    .array(z.number().int().min(0).max(6))
    .min(1)
    .max(7)
    .refine((days) => new Set(days).size === days.length, {
      message: 'Days of week must be unique',
    })
    .optional(),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
});

export const CompleteHabitInput = z.object({
  habitId: z.string().uuid(),
  scheduledAt: z.string().datetime({ local: true }).optional(),
  completedAt: z.string().datetime({ local: true }).optional(),
});

export const MyCreateApiKeyInput = z.object({
  name: z.string().min(1).max(60),
  scopes: z.array(z.enum(API_KEY_SCOPES)).min(1),
  expiresAt: z.string().datetime({ local: true }).optional(),
});
