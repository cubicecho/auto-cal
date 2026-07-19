import { API_KEY_SCOPES, PROJECT_STATUSES } from '@auto-cal/db/schema';
import { z } from 'zod';

export const CreateProjectInput = z.object({
  name: z.string().min(1).max(100),
  // Parent activity type the project's dedicated type nests under. Omit for a
  // top-level project type.
  parentActivityTypeId: z.string().uuid().nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex color')
    .optional(),
  // Auto-create an empty todo list for the project (default on).
  createList: z.boolean().default(true),
});

export const UpdateProjectInput = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  status: z.enum(PROJECT_STATUSES).optional(),
});

export const CreateProjectNoteInput = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().max(50000).default(''),
});

export const UpdateProjectNoteInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(50000).optional(),
});

export const ReorderProjectNotesInput = z.object({
  projectId: z.string().uuid(),
  noteIds: z.array(z.string().uuid()).min(1).max(500),
});

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
  minTimeBetweenInstances: z.number().int().min(0).nullable().optional(),
  pomodoroEnabled: z.boolean().optional(),
  pomodoroUnitLength: z.number().int().min(1).max(120).nullable().optional(),
  pomodoroShortBreakLength: z
    .number()
    .int()
    .min(1)
    .max(60)
    .nullable()
    .optional(),
  pomodoroUnitsBeforeLongBreak: z
    .number()
    .int()
    .min(1)
    .max(20)
    .nullable()
    .optional(),
  pomodoroLongBreakLength: z
    .number()
    .int()
    .min(1)
    .max(120)
    .nullable()
    .optional(),
  pomodoroMaxPerDay: z.number().int().min(1).max(100).nullable().optional(),
});

export const UpdateHabitInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  estimatedLength: z.number().int().min(1).max(1440).optional(),
  activityTypeId: z.string().uuid().optional(),
  frequencyCount: z.number().int().positive().min(1).max(30).optional(),
  frequencyUnit: z.enum(['week', 'month'] as const).optional(),
  minTimeBetweenInstances: z.number().int().min(0).nullable().optional(),
  pomodoroEnabled: z.boolean().optional(),
  pomodoroUnitLength: z.number().int().min(1).max(120).nullable().optional(),
  pomodoroShortBreakLength: z
    .number()
    .int()
    .min(1)
    .max(60)
    .nullable()
    .optional(),
  pomodoroUnitsBeforeLongBreak: z
    .number()
    .int()
    .min(1)
    .max(20)
    .nullable()
    .optional(),
  pomodoroLongBreakLength: z
    .number()
    .int()
    .min(1)
    .max(120)
    .nullable()
    .optional(),
  pomodoroMaxPerDay: z.number().int().min(1).max(100).nullable().optional(),
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

export const UpdateTimeBlockInput = z
  .object({
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
    priority: z.number().int().min(0).max(100).optional(),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) return data.endTime > data.startTime;
      return true;
    },
    { message: 'End time must be after start time', path: ['endTime'] },
  );

const isoDateString = z
  .string()
  .refine((s) => !Number.isNaN(new Date(s).getTime()), {
    message: 'Invalid date',
  });
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const CreateManualEventInput = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
    color: hexColor.optional(),
    startAt: isoDateString,
    endAt: isoDateString,
  })
  .refine((d) => new Date(d.endAt) > new Date(d.startAt), {
    message: 'End must be after start',
    path: ['endAt'],
  });

export const UpdateManualEventInput = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    color: hexColor.nullable().optional(),
    startAt: isoDateString.optional(),
    endAt: isoDateString.optional(),
  })
  .refine(
    (d) =>
      d.startAt && d.endAt ? new Date(d.endAt) > new Date(d.startAt) : true,
    { message: 'End must be after start', path: ['endAt'] },
  );

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

// Bulk import (e.g. Google Tasks). Dates arrive as arbitrary ISO strings from
// the export file, so they are validated loosely and parsed in the resolver;
// an unparseable value becomes null rather than rejecting the whole import.
export const ImportTodoInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullish(),
  dueAt: z.string().nullish(),
  completedAt: z.string().nullish(),
});

export const ImportTodoListInput = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).nullish(),
  activityTypeId: z.string().uuid(),
  defaultPriority: z.number().int().min(0).max(100).default(0),
  defaultEstimatedLength: z.number().int().min(0).max(1440).default(0),
  todos: z.array(ImportTodoInput).max(2000),
});

export const ImportTodosInput = z.object({
  lists: z.array(ImportTodoListInput).min(1).max(100),
});
