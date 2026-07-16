import type { Habit_HabitListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { HabitDetail } from '@/components/domain/habit/HabitDetail';
import { HabitForm } from '@/components/domain/habit/HabitForm';
import { Page } from '@/components/ui/page';
import { useQuery } from '@apollo/client/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

const GET_MY_HABITS = graphql(`
  query GetMyHabits {
    myHabits {
      ...Habit_HabitList
    }
  }
`);

type Habit = Habit_HabitListFragment;

export default function HabitDetailPage() {
  const router = useRouter();
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const { data } = useQuery(GET_MY_HABITS, {
    fetchPolicy: 'cache-and-network',
  });
  const habit = data?.myHabits.find((h) => h.id === habitId);

  if (!habit) {
    return (
      <Page>
        <p className="text-muted-foreground">Habit not found.</p>
      </Page>
    );
  }

  return (
    <Page>
      <HabitDetail
        habit={habit}
        onBack={() => router.push('/habits')}
        onEdit={(h) => {
          setEditingHabit(h);
          setFormOpen(true);
        }}
      />
      <HabitForm
        {...(editingHabit !== null ? { habit: editingHabit } : {})}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingHabit(null);
        }}
      />
    </Page>
  );
}
