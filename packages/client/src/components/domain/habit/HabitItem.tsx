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
import { InlineLengthEdit } from '@/components/ui/inline-length-edit';
import { hexToRgba } from '@/lib/utils';
import { useMutation } from '@apollo/client/react';
import { Pencil } from 'lucide-react';

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
  const [updateHabit, { loading: updatingLength }] = useMutation(
    UPDATE_HABIT_LENGTH,
    {
      refetchQueries: ['GetMyHabits'],
    },
  );

  function handleSaveLength(estimatedLength: number) {
    updateHabit({ variables: { input: { id: habit.id, estimatedLength } } });
  }

  return (
    <Card
      className="cursor-pointer transition-colors"
      onClick={() => onSelect(habit)}
      style={{
        backgroundColor: habit.activityType
          ? hexToRgba(habit.activityType.color, 0.15)
          : undefined,
      }}
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
            onClick={(e) => {
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
