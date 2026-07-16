import { graphql } from '@/__generated__/index.js';
import { ActivityTypeList } from '@/components/domain/activity-type/ActivityTypeList';
import { Page } from '@/components/ui/page';
import { useDataChanged } from '@/hooks/useDataChanged';
import { useTodosUpdated } from '@/hooks/useTodosUpdated';
import { useQuery } from '@apollo/client/react';

const GET_ACTIVITY_TYPES_PAGE = graphql(`
  query GetActivityTypesPage {
    myActivityTypes {
      ...ActivityType_ActivityTypeList
    }
    myActivityTypeStats {
      activityTypeId
      totalTodos
      completedTodos
      totalHabits
    }
  }
`);

export default function ActivityTypesPage() {
  const { data, refetch } = useQuery(GET_ACTIVITY_TYPES_PAGE, {
    fetchPolicy: 'cache-and-network',
  });
  // Stats aggregate todos + habits, so refetch on any of those signals too.
  // Stats live in the same query now, so a single refetch refreshes both.
  useDataChanged('activityType', () => {
    refetch();
  });
  useDataChanged('habit', () => {
    refetch();
  });
  useTodosUpdated(() => {
    refetch();
  });
  const rawStats = data?.myActivityTypeStats ?? [];
  const statsById = new Map(rawStats.map((s) => [s.activityTypeId, s]));
  return (
    <Page>
      <ActivityTypeList
        items={data?.myActivityTypes ?? []}
        statsById={statsById}
      />
    </Page>
  );
}
