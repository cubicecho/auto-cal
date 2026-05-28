import { graphql } from '@/__generated__/index.js';
import { ActivityTypeList } from '@/components/domain/activity-type/ActivityTypeList';
import { useQuery } from '@apollo/client/react';

const GET_ACTIVITY_TYPES_PAGE = graphql(`
  query GetActivityTypesPage {
    myActivityTypes {
      ...ActivityType_ActivityTypeList
    }
    activityTypeStats {
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
  const rawStats = data?.activityTypeStats ?? [];
  const statsById = new Map(rawStats.map((s) => [s.activityTypeId, s]));
  return (
    <div className="container mx-auto flex-1 overflow-y-auto px-4 py-6">
      <ActivityTypeList
        items={data?.myActivityTypes ?? []}
        statsById={statsById}
      />
    </div>
  );
}
