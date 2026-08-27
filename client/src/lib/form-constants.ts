/**
 * Constants shared by every form that edits a todo, habit, list, or time block.
 *
 * These were previously re-declared per file — PRIORITY_OPTIONS four times,
 * DURATION_OPTIONS three, DAY_NAMES three — and had already drifted apart:
 * TodoListForm's duration list was missing the 4+ hour option that TodoForm and
 * HabitForm both offer, so a list's default estimated length silently could not
 * be set to what a todo's could. Declare them once.
 *
 * Values are strings because `SelectField` round-trips through the DOM; call
 * sites parse with `Number(...)` on submit. Nothing here imports from React or
 * react-native, so the native screens can use it too.
 */

/** Matches `priorityLabel` in lib/utils.ts — keep the thresholds in step. */
export const PRIORITY_OPTIONS = [
  { label: 'Low', value: '0' },
  { label: 'Medium', value: '25' },
  { label: 'High', value: '50' },
  { label: 'Urgent', value: '100' },
] as const;

export const DURATION_OPTIONS = [
  { label: '15 minutes', value: '15' },
  { label: '30 minutes', value: '30' },
  { label: '45 minutes', value: '45' },
  { label: '1 hour', value: '60' },
  { label: '1.5 hours', value: '90' },
  { label: '2 hours', value: '120' },
  { label: '3 hours', value: '180' },
  { label: '4+ hours', value: '480' },
] as const;

/** Index is the `daysOfWeek` value stored on a time block. */
export const DAY_NAMES = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
] as const;

/** Same indices, spelled out — for prose rather than a toggle button. */
export const DAY_NAMES_LONG = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const WEEKDAYS = [1, 2, 3, 4, 5];
export const WEEKEND = [0, 6];

/** Mirrors the server's default in `validators.ts` / `projects.ts`. */
export const DEFAULT_ACTIVITY_COLOR = '#6366f1';

/**
 * Swatches for the activity-type pickers, and the cycle the todo importer
 * assigns from. Two lists existed with different colors for the same job.
 */
export const ACTIVITY_COLORS = [
  DEFAULT_ACTIVITY_COLOR,
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
  '#f97316',
  '#0ea5e9',
] as const;
