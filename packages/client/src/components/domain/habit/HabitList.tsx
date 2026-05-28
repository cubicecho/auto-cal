import type { Habit_HabitListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { HabitForm } from './HabitForm';
import { HabitItem } from './HabitItem';

export const HABIT_LIST_FRAGMENT = graphql(`
  fragment Habit_HabitList on Habit {
    id
    title
    description
    priority
    estimatedLength
    activityType {
      id
      name
      color
    }
    frequencyCount
    frequencyUnit
    minTimeBetweenInstances
    pomodoroEnabled
    pomodoroUnitLength
    pomodoroShortBreakLength
    pomodoroUnitsBeforeLongBreak
    pomodoroLongBreakLength
    createdAt
  }
`);

type Habit = Habit_HabitListFragment;

type HabitListProps = {
  items: Habit[];
  onSelect: (habit: Habit) => void;
};

export function HabitList({ items, onSelect }: HabitListProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  function openCreate() {
    setEditingHabit(null);
    setFormOpen(true);
  }

  function openEdit(habit: Habit) {
    setEditingHabit(habit);
    setFormOpen(true);
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingHabit(null);
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Habits</h2>
          <p className="text-sm text-muted-foreground">
            Recurring tasks scheduled regularly
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Habit
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="rounded-full bg-muted p-3">
            <RefreshCw className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">No habits yet</p>
            <p className="text-sm text-muted-foreground">
              Add a habit to track recurring tasks
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add habit
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              onEdit={openEdit}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}

      <HabitForm
        {...(editingHabit !== null ? { habit: editingHabit } : {})}
        open={formOpen}
        onOpenChange={handleFormOpenChange}
      />
    </>
  );
}
