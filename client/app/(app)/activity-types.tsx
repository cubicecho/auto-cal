import { graphql } from '@/__generated__/index.js';
import { ActivityTypeList } from '@/components/domain/activity-type/ActivityTypeList';
import { Page } from '@/components/ui/page';
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
  const { data } = useQuery(GET_ACTIVITY_TYPES_PAGE, {
    fetchPolicy: 'cache-and-network',
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
