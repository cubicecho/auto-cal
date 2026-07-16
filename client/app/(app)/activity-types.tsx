import { graphql } from '@/__generated__/index.js';
import { ActivityTypeList } from '@/components/domain/activity-type/ActivityTypeList';
import { Page } from '@/components/ui/page';
import { useQuery } from '@apollo/client/react';

const GET_MY_ACTIVITY_TYPES = graphql(`
  query GetMyActivityTypes {
    myActivityTypes {
      ...ActivityType_ActivityTypeList
    }
  }
`);

const GET_ACTIVITY_TYPE_STATS = graphql(`
  query GetActivityTypeStats {
    myActivityTypeStats {
      activityTypeId
      totalTodos
      completedTodos
      totalHabits
    }
  }
`);

export default function ActivityTypesPage() {
  const { data } = useQuery(GET_MY_ACTIVITY_TYPES, {
    fetchPolicy: 'cache-and-network',
  });
  const { data: statsData } = useQuery(GET_ACTIVITY_TYPE_STATS);
  const rawStats = statsData?.myActivityTypeStats ?? [];
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
