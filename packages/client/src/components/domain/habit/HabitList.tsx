import type { Habit_HabitListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/ui/page';
import { useListSection } from '@/hooks/useListSection';
import { Plus, RefreshCw } from 'lucide-react';
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
    pomodoroMaxPerDay
    createdAt
  }
`);

type Habit = Habit_HabitListFragment;

type HabitListProps = {
  items: Habit[];
  onSelect: (habit: Habit) => void;
};

export function HabitList({ items, onSelect }: HabitListProps) {
  const { formOpen, editing, openCreate, openEdit, handleOpenChange } =
    useListSection<Habit>();

  return (
    <>
      <PageHeader
        title="Habits"
        subtitle="Recurring tasks scheduled regularly"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Habit
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={RefreshCw}
          title="No habits yet"
          description="Add a habit to track recurring tasks"
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add habit
            </Button>
          }
        />
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
        {...(editing !== null ? { habit: editing } : {})}
        open={formOpen}
        onOpenChange={handleOpenChange}
      />
    </>
  );
}
