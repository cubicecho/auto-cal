import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="flex items-center gap-2">
      {/* Today — always rendered so nav arrows don't shift on navigate */}
      <Button
        variant="outline"
        size="sm"
        disabled={isCurrent}
        className="disabled:opacity-40"
        onClick={onToday}
      >
        Today
      </Button>

      {/* View switcher */}
      <div className="flex rounded-md border p-0.5 gap-0.5">
        {(['day', 'week', 'month'] as const).map((v) => (
          <Button
            key={v}
            size="sm"
            variant={view === v ? 'default' : 'ghost'}
            className="h-7 px-2.5 text-xs capitalize"
            onClick={() => onViewChange(v)}
          >
            {v}
          </Button>
        ))}
      </div>

      {/* Date navigation */}
      <Button variant="outline" size="sm" onClick={onPrev}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[160px] text-center text-sm font-medium">
        {dateLabel}
      </span>
      <Button variant="outline" size="sm" onClick={onNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
