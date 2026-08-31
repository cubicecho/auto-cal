/**
 * The native calendar: a month grid built from date-fns, which the client
 * already depends on.
 *
 * Written out rather than pulling in react-native-calendars: the whole surface
 * is one month of single-date selection, and a calendar library brings its own
 * theming system that would sit outside the tailwind tokens every other
 * primitive follows.
 */
import type { CalendarProps } from '@/components/ui/calendar-base';
import { ChevronLeft, ChevronRight } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function Calendar({
  selected,
  onSelect,
  defaultMonth,
  className,
}: CalendarProps) {
  const [month, setMonth] = useState(
    () => defaultMonth ?? selected ?? new Date(),
  );

  // Padded out to whole weeks so every row has seven cells and the grid does
  // not reflow as the month changes.
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month)),
    end: endOfWeek(endOfMonth(month)),
  });

  return (
    <View className={cn('p-3', className)}>
      <View className="mb-2 flex-row items-center justify-between">
        <Pressable
          onPress={() => setMonth(addMonths(month, -1))}
          aria-label="Previous month"
          className="p-1"
        >
          <ChevronLeft className="h-4 w-4 text-foreground" />
        </Pressable>
        <Text className="text-sm font-medium text-foreground">
          {format(month, 'MMMM yyyy')}
        </Text>
        <Pressable
          onPress={() => setMonth(addMonths(month, 1))}
          aria-label="Next month"
          className="p-1"
        >
          <ChevronRight className="h-4 w-4 text-foreground" />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAYS.map((day) => (
          <Text
            key={day}
            className="flex-1 text-center text-xs text-muted-foreground"
          >
            {day}
          </Text>
        ))}
      </View>

      <View className="flex-row flex-wrap">
        {days.map((day) => {
          const isSelected = selected ? isSameDay(day, selected) : false;
          return (
            <Pressable
              key={day.toISOString()}
              onPress={() => onSelect(day)}
              // Seven per row, and `flex-wrap` needs a width it can measure.
              className={cn(
                'h-9 items-center justify-center rounded-md',
                isSelected && 'bg-primary',
              )}
              style={{ width: `${100 / 7}%` }}
            >
              <Text
                className={cn(
                  'text-sm',
                  isSelected
                    ? 'text-primary-foreground'
                    : isSameMonth(day, month)
                      ? 'text-foreground'
                      : 'text-muted-foreground',
                )}
              >
                {format(day, 'd')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
