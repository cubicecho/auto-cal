import type { TimeBlock_TimeBlockListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { hexToDesaturated, useIsDark } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

const DELETE_TIME_BLOCK = graphql(`
  mutation DeleteTimeBlock($id: ID!) {
    myDeleteTimeBlock(id: $id)
  }
`);

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
  const isDark = useIsDark();
  const [confirming, setConfirming] = useState(false);

  const [deleteTimeBlock, { loading: deleting }] = useMutation(
    DELETE_TIME_BLOCK,
    { refetchQueries: ['GetMyTimeBlocks'] },
  );

  async function handleDelete() {
    await deleteTimeBlock({ variables: { id: timeBlock.id } });
  }

  return (
    <Card
      style={{
        backgroundColor: timeBlock.activityType
          ? hexToDesaturated(timeBlock.activityType.color, isDark)
          : undefined,
      }}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {timeBlock.activityType?.name ?? 'Unassigned'}
            </CardTitle>
            <CardDescription>
              {timeBlock.daysOfWeek
                .map((d) => DAY_NAMES[d] ?? `Day ${d}`)
                .join(', ')}{' '}
              • {timeBlock.startTime} – {timeBlock.endTime}
              {timeBlock.priority > 0 && ` • Priority ${timeBlock.priority}`}
            </CardDescription>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onEdit(timeBlock)}
              aria-label="Edit time block"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            {confirming ? (
              <>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirming(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setConfirming(true)}
                aria-label="Delete time block"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
