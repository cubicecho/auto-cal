import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ActivityType,
  ApiKey,
  Habit,
  HabitCompletion,
  TimeBlock,
  Todo,
  TodoList,
  User,
} from '@auto-cal/db';
import { buildMocks } from '@vantreeseba/graphql-mocks';

const __dirname = dirname(fileURLToPath(import.meta.url));
const schema = readFileSync(
  resolve(__dirname, '../src/__generated__/schema.graphql'),
  'utf8',
);

// Build once at module load; seed=42 keeps output deterministic across runs.
// DateTime returns Date objects to match the DB layer's timestamp types.
// nullChance=1 makes all nullable relation fields null by default.
const base = buildMocks(schema, {
  seed: 42,
  scalars: { DateTime: (f) => f.date.recent() },
  nullChance: 1,
});

function first<T>(typeName: string): T {
  const item = (base[typeName] as unknown[])?.[0];
  if (item === undefined)
    throw new Error(`[test-mocks] no mock for ${typeName}`);
  return item as T;
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    ...first<User>('User'),
    id: 'user-1',
    email: 'test@example.com',
    timezone: 'UTC',
    ...overrides,
  };
}

export function makeActivityType(
  overrides: Partial<ActivityType> = {},
): ActivityType {
  return {
    ...first<ActivityType>('ActivityType'),
    id: 'at-work',
    name: 'Work',
    color: '#6366f1',
    ...overrides,
  };
}

export function makeTimeBlock(overrides: Partial<TimeBlock> = {}): TimeBlock {
  return {
    ...first<TimeBlock>('TimeBlock'),
    activityTypeId: 'at-work',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startTime: '09:00',
    endTime: '17:00',
    priority: 0,
    ...overrides,
  };
}

export function makeTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    ...first<Todo>('Todo'),
    listId: 'list-1',
    title: 'Write tests',
    estimatedLength: 60,
    priority: 1,
    manuallyScheduled: false,
    ...overrides,
  };
}

export function makeTodoList(overrides: Partial<TodoList> = {}): TodoList {
  return {
    ...first<TodoList>('TodoList'),
    id: 'list-1',
    name: 'Work Tasks',
    activityTypeId: 'at-work',
    defaultPriority: 0,
    defaultEstimatedLength: 0,
    ...overrides,
  };
}

export function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    ...first<Habit>('Habit'),
    activityTypeId: 'at-work',
    title: 'Morning run',
    frequencyCount: 3,
    frequencyUnit: 'week',
    estimatedLength: 30,
    priority: 1,
    pomodoroEnabled: false,
    pomodoroUnitLength: null,
    pomodoroShortBreakLength: null,
    pomodoroUnitsBeforeLongBreak: null,
    pomodoroLongBreakLength: null,
    pomodoroMaxPerDay: null,
    ...overrides,
  };
}

export function makeApiKey(overrides: Partial<ApiKey> = {}): ApiKey {
  return {
    ...first<ApiKey>('ApiKey'),
    userId: 'user-1',
    name: 'Test key',
    keyHash: 'fakehash',
    keyPrefix: 'dGVzdGt',
    scopes: ['read'],
    ...overrides,
  };
}

export function makeHabitCompletion(
  habitId: string,
  overrides: Partial<HabitCompletion> = {},
): HabitCompletion {
  return {
    ...first<HabitCompletion>('HabitCompletion'),
    id: crypto.randomUUID(),
    habitId,
    completedAt: new Date(),
    ...overrides,
  };
}
