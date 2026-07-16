import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

interface DateTimeInputProps {
  value: Date;
  onChange: (next: Date) => void;
  className?: string;
}

/**
 * Combined date + time picker.
 *
 * - Date is chosen via a popover-mounted shadcn calendar.
 * - Time is a styled native `<input type="time">` (HH:mm) — keeps the
 *   composite light without pulling a second picker library.
 *
 * The two inputs always commit a single Date back via `onChange`.
 */
export function DateTimeInput({
  value,
  onChange,
  className,
}: DateTimeInputProps) {
  const [open, setOpen] = useState(false);
  const timeStr = format(value, 'HH:mm');

  function handleDateSelect(picked: Date | undefined) {
    if (!picked) return;
    const next = new Date(picked);
    next.setHours(value.getHours(), value.getMinutes(), 0, 0);
    onChange(next);
    setOpen(false);
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const parts = e.target.value.split(':').map(Number);
    const hh = parts[0];
    const mm = parts[1];
    if (hh === undefined || mm === undefined) return;
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;
    const next = new Date(value);
    next.setHours(hh, mm, 0, 0);
    onChange(next);
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="flex-1 justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {format(value, 'PPP')}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            defaultMonth={value}
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        value={timeStr}
        onChange={handleTimeChange}
        className="w-[120px]"
      />
    </div>
  );
}
