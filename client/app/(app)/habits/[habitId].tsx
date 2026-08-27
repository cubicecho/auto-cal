import type { Habit_HabitListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { HabitDetail } from '@/components/domain/habit/HabitDetail';
import { HabitForm } from '@/components/domain/habit/HabitForm';
import { DetailPage } from '@/components/ui/detail-page';
import { useQuery } from '@apollo/client/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

// Filtered server-side rather than fetching every habit and `.find()`ing —
// `myHabits` is AND-ed with the caller's scope, so a foreign id yields [].
const GET_HABIT_BY_ID = graphql(`
  query GetHabitById($id: UUID!) {
    myHabits(where: { id: { eq: $id } }, limit: 1) {
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

  const { data, loading } = useQuery(GET_HABIT_BY_ID, {
    variables: { id: habitId },
    fetchPolicy: 'cache-and-network',
  });
  const habit = data?.myHabits[0];

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
            onDeleted={() => router.push('/habits')}
          />
        </>
      )}
    </DetailPage>
  );
}
