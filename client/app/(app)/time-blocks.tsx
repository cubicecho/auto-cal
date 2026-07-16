import { graphql } from '@/__generated__/index.js';
import { TimeBlockList } from '@/components/domain/time-block/TimeBlockList';
import { Page } from '@/components/ui/page';
import { useDataChanged } from '@/hooks/useDataChanged';
import { useQuery } from '@apollo/client/react';

const GET_MY_TIME_BLOCKS = graphql(`
  query GetMyTimeBlocks {
    myTimeBlocks {
      ...TimeBlock_TimeBlockList
    }
  }
`);

export default function TimeBlocksPage() {
  const { data, refetch } = useQuery(GET_MY_TIME_BLOCKS, {
    fetchPolicy: 'cache-and-network',
  });
  useDataChanged('timeBlock', () => {
    refetch();
  });
  return (
    <Page>
      <TimeBlockList items={data?.myTimeBlocks ?? []} />
    </Page>
  );
}
