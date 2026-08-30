import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState } from 'react';
import { View } from 'react-native';

interface DateTimeInputProps {
  value: Date;
  onChange: (next: Date) => void;
  className?: string;
}

/**
 * Combined date + time picker.
 *
 * - Date is chosen from a `Calendar` in a `Popover` — a dropdown anchored to
 *   the trigger on web, a sheet on native.
 * - Time is an `Input type="time"`: a real `<input type="time">` on web, a
 *   plain HH:mm text field on native, which is the split `input` exists for.
 *
 * Shared by both platforms with no `.web.tsx`: every piece it composes is
 * already a cross-platform primitive. The two inputs always commit a single
 * Date back via `onChange`.
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

  function handleTimeChange(text: string) {
    const parts = text.split(':').map(Number);
    const hh = parts[0];
    const mm = parts[1];
    if (hh === undefined || mm === undefined) return;
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;
    const next = new Date(value);
    next.setHours(hh, mm, 0, 0);
    onChange(next);
  }

  return (
    <View className={cn('flex-row items-center gap-2', className)}>
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
            selected={value}
            onSelect={handleDateSelect}
            defaultMonth={value}
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        value={timeStr}
        onChangeText={handleTimeChange}
        className="w-[120px]"
      />
    </View>
  );
}
