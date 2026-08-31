/**
 * The web calendar: react-day-picker, using the library's own stylesheet so we
 * do not have to track its evolving `classNames` API across versions.
 * `calendar.tsx` is the native counterpart; `calendar-base.ts` holds the
 * contract they share.
 */
import type { CalendarProps } from '@/components/ui/calendar-base';
import { cn } from '@/lib/utils';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

export function Calendar({
  selected,
  onSelect,
  defaultMonth,
  className,
}: CalendarProps) {
  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={onSelect}
      {...(defaultMonth ? { defaultMonth } : {})}
      className={cn('p-3', className)}
    />
  );
}
