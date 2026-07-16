import { describe, expect, it } from 'vitest';
import {
  CompleteHabitInput,
  CreateActivityTypeInput,
  CreateHabitInput,
  CreateTimeBlockInput,
  CreateTodoInput,
  UpdateActivityTypeInput,
  UpdateHabitInput,
  UpdateTimeBlockInput,
  UpdateTodoInput,
} from '../../src/schema/validators.ts';

describe('CreateActivityTypeInput', () => {
  it('accepts valid input with name only (uses default color)', () => {
    const result = CreateActivityTypeInput.parse({ name: 'Work' });
    expect(result.name).toBe('Work');
    expect(result.color).toBe('#6366f1');
  });

  it('accepts valid input with custom color', () => {
    expect(() =>
      CreateActivityTypeInput.parse({ name: 'Gym', color: '#10b981' }),
    ).not.toThrow();
  });

  it('rejects empty name', () => {
    expect(() => CreateActivityTypeInput.parse({ name: '' })).toThrow();
  });

  it('rejects name exceeding 100 characters', () => {
    expect(() =>
      CreateActivityTypeInput.parse({ name: 'a'.repeat(101) }),
    ).toThrow();
  });

  it('rejects invalid color format (no hash)', () => {
    expect(() =>
      CreateActivityTypeInput.parse({ name: 'Work', color: '6366f1' }),
    ).toThrow();
  });

  it('rejects invalid color format (wrong length)', () => {
    expect(() =>
      CreateActivityTypeInput.parse({ name: 'Work', color: '#fff' }),
    ).toThrow();
  });

  it('rejects invalid color format (non-hex characters)', () => {
    expect(() =>
      CreateActivityTypeInput.parse({ name: 'Work', color: '#zzzzzz' }),
    ).toThrow();
  });
});

describe('UpdateActivityTypeInput', () => {
  const validId = '00000000-0000-0000-0000-000000000001';

  it('accepts valid update with only id', () => {
    expect(() => UpdateActivityTypeInput.parse({ id: validId })).not.toThrow();
  });

  it('accepts partial update', () => {
    expect(() =>
      UpdateActivityTypeInput.parse({ id: validId, name: 'New Name' }),
    ).not.toThrow();
  });

  it('rejects invalid uuid', () => {
    expect(() => UpdateActivityTypeInput.parse({ id: 'not-a-uuid' })).toThrow();
  });

  it('rejects invalid color in update', () => {
    expect(() =>
      UpdateActivityTypeInput.parse({ id: validId, color: 'red' }),
    ).toThrow();
  });
});

describe('CreateTodoInput', () => {
  const validListId = '00000000-0000-0000-0000-000000000001';

  it('accepts valid minimal input', () => {
    const result = CreateTodoInput.parse({
      title: 'My todo',
      estimatedLength: 30,
      listId: validListId,
    });
    expect(result.title).toBe('My todo');
    expect(result.priority).toBe(0); // default
  });

  it('accepts all optional fields', () => {
    expect(() =>
      CreateTodoInput.parse({
        title: 'Full todo',
        description: 'A description',
        priority: 75,
        estimatedLength: 60,
        listId: validListId,
        dueAt: '2026-05-01T17:00:00',
        scheduledAt: '2026-04-28T09:00:00',
      }),
    ).not.toThrow();
  });

  it('rejects missing listId', () => {
    expect(() => CreateTodoInput.parse({ title: 'Test' })).toThrow();
  });

  it('rejects empty title', () => {
    expect(() =>
      CreateTodoInput.parse({ title: '', listId: validListId }),
    ).toThrow();
  });

  it('rejects title exceeding 200 characters', () => {
    expect(() =>
      CreateTodoInput.parse({
        title: 'a'.repeat(201),
        listId: validListId,
      }),
    ).toThrow();
  });

  it('rejects priority below 0', () => {
    expect(() =>
      CreateTodoInput.parse({
        title: 'Test',
        priority: -1,
        listId: validListId,
      }),
    ).toThrow();
  });

  it('rejects priority above 100', () => {
    expect(() =>
      CreateTodoInput.parse({
        title: 'Test',
        priority: 101,
        listId: validListId,
      }),
    ).toThrow();
  });

  it('rejects estimatedLength of 0', () => {
    expect(() =>
      CreateTodoInput.parse({
        title: 'Test',
        estimatedLength: 0,
        listId: validListId,
      }),
    ).toThrow();
  });

  it('rejects estimatedLength exceeding 1440', () => {
    expect(() =>
      CreateTodoInput.parse({
        title: 'Test',
        estimatedLength: 1441,
        listId: validListId,
      }),
    ).toThrow();
  });

  it('rejects invalid listId (not a UUID)', () => {
    expect(() =>
      CreateTodoInput.parse({ title: 'Test', listId: 'not-a-uuid' }),
    ).toThrow();
  });
});

describe('UpdateTodoInput', () => {
  const validId = '00000000-0000-0000-0000-000000000001';

  it('accepts update with only id', () => {
    expect(() => UpdateTodoInput.parse({ id: validId })).not.toThrow();
  });

  it('accepts changing listId to a valid uuid', () => {
    expect(() =>
      UpdateTodoInput.parse({ id: validId, listId: validId }),
    ).not.toThrow();
  });

  it('accepts clearing dueAt to null', () => {
    expect(() =>
      UpdateTodoInput.parse({ id: validId, dueAt: null }),
    ).not.toThrow();
  });

  it('rejects non-uuid id', () => {
    expect(() => UpdateTodoInput.parse({ id: 'bad-id' })).toThrow();
  });

  it('rejects priority out of range', () => {
    expect(() =>
      UpdateTodoInput.parse({ id: validId, priority: 150 }),
    ).toThrow();
  });
});

describe('CreateHabitInput', () => {
  const validActivityTypeId = '00000000-0000-0000-0000-000000000001';

  it('accepts valid input', () => {
    const result = CreateHabitInput.parse({
      title: 'Exercise',
      frequencyCount: 3,
      frequencyUnit: 'week',
      activityTypeId: validActivityTypeId,
    });
    expect(result.title).toBe('Exercise');
    expect(result.priority).toBe(0);
  });

  it('rejects missing activityTypeId', () => {
    expect(() =>
      CreateHabitInput.parse({
        title: 'Test',
        frequencyCount: 3,
        frequencyUnit: 'week',
      }),
    ).toThrow();
  });

  it('rejects empty title', () => {
    expect(() =>
      CreateHabitInput.parse({
        title: '',
        frequencyCount: 3,
        frequencyUnit: 'week',
        activityTypeId: validActivityTypeId,
      }),
    ).toThrow();
  });

  it('rejects frequencyCount of 0', () => {
    expect(() =>
      CreateHabitInput.parse({
        title: 'Test',
        frequencyCount: 0,
        frequencyUnit: 'week',
        activityTypeId: validActivityTypeId,
      }),
    ).toThrow();
  });

  it('rejects frequencyCount exceeding 30', () => {
    expect(() =>
      CreateHabitInput.parse({
        title: 'Test',
        frequencyCount: 31,
        frequencyUnit: 'week',
        activityTypeId: validActivityTypeId,
      }),
    ).toThrow();
  });

  it('rejects invalid frequencyUnit', () => {
    expect(() =>
      CreateHabitInput.parse({
        title: 'Test',
        frequencyCount: 3,
        frequencyUnit: 'day',
        activityTypeId: validActivityTypeId,
      }),
    ).toThrow();
  });

  it('accepts month as frequencyUnit', () => {
    expect(() =>
      CreateHabitInput.parse({
        title: 'Monthly review',
        frequencyCount: 1,
        frequencyUnit: 'month',
        activityTypeId: validActivityTypeId,
      }),
    ).not.toThrow();
  });
});

describe('UpdateHabitInput', () => {
  const validId = '00000000-0000-0000-0000-000000000001';

  it('accepts partial update', () => {
    expect(() =>
      UpdateHabitInput.parse({ id: validId, title: 'New title' }),
    ).not.toThrow();
  });

  it('rejects non-uuid id', () => {
    expect(() => UpdateHabitInput.parse({ id: 'bad' })).toThrow();
  });
});

describe('CreateTimeBlockInput', () => {
  const validActivityTypeId = '00000000-0000-0000-0000-000000000001';

  it('accepts valid time block', () => {
    expect(() =>
      CreateTimeBlockInput.parse({
        daysOfWeek: [1, 3, 5],
        startTime: '09:00',
        endTime: '12:00',
        activityTypeId: validActivityTypeId,
      }),
    ).not.toThrow();
  });

  it('rejects missing activityTypeId', () => {
    expect(() =>
      CreateTimeBlockInput.parse({
        daysOfWeek: [1],
        startTime: '09:00',
        endTime: '12:00',
      }),
    ).toThrow();
  });

  it('rejects when end time is before start time', () => {
    expect(() =>
      CreateTimeBlockInput.parse({
        daysOfWeek: [1],
        startTime: '12:00',
        endTime: '09:00',
        activityTypeId: validActivityTypeId,
      }),
    ).toThrow();
  });

  it('rejects when end time equals start time', () => {
    expect(() =>
      CreateTimeBlockInput.parse({
        daysOfWeek: [1],
        startTime: '09:00',
        endTime: '09:00',
        activityTypeId: validActivityTypeId,
      }),
    ).toThrow();
  });

  it('rejects duplicate days of week', () => {
    expect(() =>
      CreateTimeBlockInput.parse({
        daysOfWeek: [1, 1, 3],
        startTime: '09:00',
        endTime: '12:00',
        activityTypeId: validActivityTypeId,
      }),
    ).toThrow();
  });

  it('rejects empty daysOfWeek array', () => {
    expect(() =>
      CreateTimeBlockInput.parse({
        daysOfWeek: [],
        startTime: '09:00',
        endTime: '12:00',
        activityTypeId: validActivityTypeId,
      }),
    ).toThrow();
  });

  it('rejects day of week out of range', () => {
    expect(() =>
      CreateTimeBlockInput.parse({
        daysOfWeek: [7],
        startTime: '09:00',
        endTime: '12:00',
        activityTypeId: validActivityTypeId,
      }),
    ).toThrow();
  });

  it('rejects invalid time format', () => {
    expect(() =>
      CreateTimeBlockInput.parse({
        daysOfWeek: [1],
        startTime: '9am',
        endTime: '12:00',
        activityTypeId: validActivityTypeId,
      }),
    ).toThrow();
  });
});

describe('UpdateTimeBlockInput', () => {
  const validId = '00000000-0000-0000-0000-000000000001';

  it('accepts partial update with only id', () => {
    expect(() => UpdateTimeBlockInput.parse({ id: validId })).not.toThrow();
  });

  it('rejects duplicate days in update', () => {
    expect(() =>
      UpdateTimeBlockInput.parse({ id: validId, daysOfWeek: [2, 2] }),
    ).toThrow();
  });
});

describe('CompleteHabitInput', () => {
  const validHabitId = '00000000-0000-0000-0000-000000000001';

  it('accepts valid habitId', () => {
    expect(() =>
      CompleteHabitInput.parse({ habitId: validHabitId }),
    ).not.toThrow();
  });

  it('accepts optional scheduledAt', () => {
    expect(() =>
      CompleteHabitInput.parse({
        habitId: validHabitId,
        scheduledAt: '2026-04-27T09:00:00.000Z',
      }),
    ).not.toThrow();
  });

  it('accepts optional completedAt', () => {
    expect(() =>
      CompleteHabitInput.parse({
        habitId: validHabitId,
        completedAt: '2026-04-27T09:00:00.000Z',
      }),
    ).not.toThrow();
  });

  it('accepts both scheduledAt and completedAt', () => {
    expect(() =>
      CompleteHabitInput.parse({
        habitId: validHabitId,
        scheduledAt: '2026-04-27T09:00:00.000Z',
        completedAt: '2026-04-27T09:30:00.000Z',
      }),
    ).not.toThrow();
  });

  it('rejects non-uuid habitId', () => {
    expect(() => CompleteHabitInput.parse({ habitId: 'not-a-uuid' })).toThrow();
  });
});
