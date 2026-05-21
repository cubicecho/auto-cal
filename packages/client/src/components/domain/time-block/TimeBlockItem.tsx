import type { TimeBlock_TimeBlockListFragment } from '@/__generated__/graphql.js';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { hexToRgba } from '@/lib/utils';
import { Pencil } from 'lucide-react';

type TimeBlock = TimeBlock_TimeBlockListFragment;

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

type TimeBlockItemProps = {
  timeBlock: TimeBlock;
  onEdit: (timeBlock: TimeBlock) => void;
};

export function TimeBlockItem({ timeBlock, onEdit }: TimeBlockItemProps) {
  return (
    <Card
      style={{
        backgroundColor: timeBlock.activityType
          ? hexToRgba(timeBlock.activityType.color, 0.15)
          : undefined,
      }}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {timeBlock.activityType ? (
                <>
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: timeBlock.activityType.color }}
                  />
                  {timeBlock.activityType.name}
                </>
              ) : (
                'Unassigned'
              )}
            </CardTitle>
            <CardDescription>
              {timeBlock.daysOfWeek
                .map((d) => DAY_NAMES[d] ?? `Day ${d}`)
                .join(', ')}{' '}
              • {timeBlock.startTime} – {timeBlock.endTime}
              {timeBlock.priority > 0 && ` • Priority ${timeBlock.priority}`}
            </CardDescription>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onEdit(timeBlock)}
            aria-label="Edit time block"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
}
