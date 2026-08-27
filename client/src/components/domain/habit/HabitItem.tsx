import type { Habit_HabitListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Pencil } from '@/components/ui/icons';
import { InlineLengthEdit } from '@/components/ui/inline-length-edit';
import { useToast } from '@/components/ui/toast';
import { DERIVED, invalidate } from '@/lib/cache';
import { errorMessage } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';

const UPDATE_HABIT_LENGTH = graphql(`
  mutation UpdateHabitEstimatedLength($input: UpdateHabitArgs!) {
    myUpdateHabit(input: $input) {
      id
      estimatedLength
    }
  }
`);

type Habit = Habit_HabitListFragment;

type HabitItemProps = {
  habit: Habit;
  onEdit: (habit: Habit) => void;
  onSelect: (habit: Habit) => void;
};

export function HabitItem({ habit, onEdit, onSelect }: HabitItemProps) {
  const toast = useToast();
  const [updateHabit, { loading: updatingLength }] = useMutation(
    UPDATE_HABIT_LENGTH,
    {
      // Returns the habit, so the list patches itself; only the schedule,
      // which packs instances by estimated length, has to be dropped.
      update: (cache) => invalidate(cache, ...DERIVED),
    },
  );

  function handleSaveLength(estimatedLength: number) {
    updateHabit({
      variables: { input: { id: habit.id, estimatedLength } },
    }).catch((err) => toast(errorMessage(err, 'Could not save the length')));
  }

  return (
    <Card
      className="cursor-pointer transition-colors"
      onPress={() => onSelect(habit)}
      accentColor={habit.activityType?.color}
      accentLabel={habit.activityType?.name}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{habit.title}</CardTitle>
            <CardDescription>
              {habit.activityType && (
                <span>
                  {habit.activityType.name}
                  {' • '}
                </span>
              )}
              <InlineLengthEdit
                value={habit.estimatedLength}
                saving={updatingLength}
                onSave={handleSaveLength}
              />
              {' • '}
              {habit.frequencyCount}x per {habit.frequencyUnit}
              {' • '}Priority: {habit.priority}
            </CardDescription>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onPress={(e) => {
              e.stopPropagation();
              onEdit(habit);
            }}
            aria-label={`Edit ${habit.title}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      {habit.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground">{habit.description}</p>
        </CardContent>
      )}
    </Card>
  );
}
