import type { Habit_HabitListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { HabitDetail } from '@/components/domain/habit/HabitDetail';
import { HabitForm } from '@/components/domain/habit/HabitForm';
import { DetailPage } from '@/components/ui/detail-page';
import { useDataChanged } from '@/hooks/useDataChanged';
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

  const { data, loading, refetch } = useQuery(GET_MY_HABITS, {
    fetchPolicy: 'cache-and-network',
  });
  useDataChanged('habit', () => {
    refetch();
  });
  const habit = data?.myHabits.find((h) => h.id === habitId);

  return (
    <DetailPage
      entity={habit}
      loading={loading}
      notFoundLabel="Habit not found."
    >
      {(h) => (
        <>
          <HabitDetail
            habit={h}
            onBack={() => router.push('/habits')}
            onEdit={(edit) => {
              setEditingHabit(edit);
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
        </>
      )}
    </DetailPage>
  );
}
