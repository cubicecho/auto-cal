import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from '@/components/ui/icons';
import { Text, View } from 'react-native';

type CalendarViewMode = 'day' | 'week' | 'month';

type WeekNavigatorProps = {
  date: Date;
  view: CalendarViewMode;
  dateLabel: string;
  isCurrent: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarViewMode) => void;
};

export function WeekNavigator({
  view,
  dateLabel,
  isCurrent,
  onPrev,
  onNext,
  onToday,
  onViewChange,
}: WeekNavigatorProps) {
  return (
    <View className="flex-row items-center gap-2">
      {/* Today — always rendered so nav arrows don't shift on navigate */}
      <Button
        variant="outline"
        size="sm"
        disabled={isCurrent}
        className="disabled:opacity-40"
        onPress={onToday}
      >
        Today
      </Button>

      {/* View switcher */}
      <View className="flex-row rounded-md border p-0.5 gap-0.5">
        {(['day', 'week', 'month'] as const).map((v) => (
          <Button
            key={v}
            size="sm"
            variant={view === v ? 'default' : 'ghost'}
            className="h-7 px-2.5 text-xs capitalize"
            onPress={() => onViewChange(v)}
          >
            {v}
          </Button>
        ))}
      </View>

      {/* Date navigation */}
      <Button variant="outline" size="sm" onPress={onPrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Text className="min-w-[160px] text-center text-sm font-medium">
        {dateLabel}
      </Text>
      <Button variant="outline" size="sm" onPress={onNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </View>
  );
}
