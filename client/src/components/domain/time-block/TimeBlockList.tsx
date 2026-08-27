import type { TimeBlock_TimeBlockListFragment } from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { Clock, Plus } from '@/components/ui/icons';
import { EmptyState, PageHeader } from '@/components/ui/page';
import { QueryState } from '@/components/ui/query-state';
import { useListSection } from '@/hooks/useListSection';
import { TimeBlockForm } from './TimeBlockForm';
import { TimeBlockItem } from './TimeBlockItem';

export const TIME_BLOCK_LIST_FRAGMENT = graphql(`
  fragment TimeBlock_TimeBlockList on TimeBlock {
    id
    activityType {
      id
      name
      color
    }
    daysOfWeek
    startTime
    endTime
    priority
    createdAt
  }
`);

type TimeBlock = TimeBlock_TimeBlockListFragment;

type TimeBlockListProps = {
  items: TimeBlock[];
  loading?: boolean;
  error?: Error | null;
};

export function TimeBlockList({ items, loading, error }: TimeBlockListProps) {
  const { formOpen, editing, openCreate, openEdit, handleOpenChange } =
    useListSection<TimeBlock>();

  return (
    <>
      <PageHeader
        title="Time Blocks"
        subtitle="Designated time periods for different activity types"
        actions={
          <Button size="sm" onPress={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Time Block
          </Button>
        }
      />

      <QueryState
        loading={loading}
        error={error}
        loadingLabel="Loading time blocks…"
        errorLabel="Error loading time blocks"
      />
      {!loading && items.length === 0 && (
        <EmptyState
          icon={Clock}
          title="No time blocks yet"
          description="Time blocks define when the scheduler can place your todos and habits"
          action={
            <Button size="sm" onPress={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add time block
            </Button>
          }
        />
      )}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((block) => (
            <TimeBlockItem key={block.id} timeBlock={block} onEdit={openEdit} />
          ))}
        </div>
      )}

      <TimeBlockForm
        {...(editing !== null ? { timeBlock: editing } : {})}
        open={formOpen}
        onOpenChange={handleOpenChange}
      />
    </>
  );
}
