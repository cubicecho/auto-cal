import { graphql } from '@/__generated__/index.js';
import { HabitList } from '@/components/domain/habit/HabitList';
import { Page } from '@/components/ui/page';
import { useQuery } from '@apollo/client/react';
import { useRouter } from 'expo-router';

const GET_MY_HABITS = graphql(`
  query GetMyHabits {
    myHabits {
      ...Habit_HabitList
    }
  }
`);

export default function HabitsPage() {
  const router = useRouter();
  const { data } = useQuery(GET_MY_HABITS, {
    fetchPolicy: 'cache-and-network',
  });

  return (
    <Page>
      <HabitList
        items={data?.myHabits ?? []}
        onSelect={(habit) => router.push(`/habits/${habit.id}`)}
      />
    </Page>
  );
}
