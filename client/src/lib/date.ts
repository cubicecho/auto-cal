import { format, startOfWeek } from 'date-fns';

/**
 * Monday of the week `date` falls in, at local midnight.
 *
 * The ISO week is what the scheduler works in, so every screen that asks for a
 * `weekStart` needs this. Two of them had each hand-rolled the same
 * `getDay() === 0 ? -6 : 1 - day` arithmetic; date-fns already does it.
 */
export function weekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/** Local-time `YYYY-MM-DD` — the shape every date argument in the API takes. */
export function isoDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
