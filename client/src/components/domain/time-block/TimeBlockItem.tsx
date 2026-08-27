import type { TimeBlock_TimeBlockListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DERIVED, evictEntity, invalidate } from '@/lib/cache';
import { DAY_NAMES_LONG } from '@/lib/form-constants';
import { errorMessage } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

const DELETE_TIME_BLOCK = graphql(`
  mutation DeleteTimeBlock($id: ID!) {
    myDeleteTimeBlock(id: $id)
  }
`);

type TimeBlock = TimeBlock_TimeBlockListFragment;

type TimeBlockItemProps = {
  timeBlock: TimeBlock;
  onEdit: (timeBlock: TimeBlock) => void;
};

export function TimeBlockItem({ timeBlock, onEdit }: TimeBlockItemProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [deleteTimeBlock, { loading: deleting }] = useMutation(
    DELETE_TIME_BLOCK,
    {
      update: (cache) => {
        evictEntity(cache, 'TimeBlock', timeBlock.id);
        invalidate(cache, ...DERIVED);
      },
    },
  );

  async function handleDelete() {
    try {
      setDeleteError(null);
      await deleteTimeBlock({ variables: { id: timeBlock.id } });
    } catch (err) {
      // Without this the rejected promise was unhandled and the card just sat
      // there in its "Delete / Cancel" state, looking like nothing happened.
      setDeleteError(errorMessage(err, 'Failed to delete time block'));
    }
  }

  return (
    <Card
      accentColor={timeBlock.activityType?.color}
      accentLabel={timeBlock.activityType?.name}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {timeBlock.activityType?.name ?? 'Unassigned'}
            </CardTitle>
            <CardDescription>
              {timeBlock.daysOfWeek
                .map((d) => DAY_NAMES_LONG[d] ?? `Day ${d}`)
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

        {deleteError ? (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {deleteError}
          </p>
        ) : null}
      </CardHeader>
    </Card>
  );
}
