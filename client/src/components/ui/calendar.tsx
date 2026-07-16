import { cn } from '@/lib/utils';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Minimal wrapper around react-day-picker.
 * Uses the library's built-in styles (`react-day-picker/style.css`) so we
 * don't have to track its evolving classNames API across versions.
 */
export function Calendar({ className, ...props }: CalendarProps) {
  return <DayPicker className={cn('p-3', className)} {...props} />;
}
