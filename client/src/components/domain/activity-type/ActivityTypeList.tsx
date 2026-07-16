import type {
  ActivityType_ActivityTypeListFragment,
  GetActivityTypeStatsQuery,
} from '@/__generated__/graphql.js';

type ActivityTypeStats =
  GetActivityTypeStatsQuery['myActivityTypeStats'][number];
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { ColorBar } from '@/components/ui/color-bar';
import { EmptyState, PageHeader } from '@/components/ui/page';
import { useListSection } from '@/hooks/useListSection';
import { Pencil, Plus, Tag } from 'lucide-react';
import { ActivityTypeForm } from './ActivityTypeForm';

// ─── GraphQL ────────────────────────────────────────────────────────────────

export const ACTIVITY_TYPE_LIST_FRAGMENT = graphql(`
  fragment ActivityType_ActivityTypeList on ActivityType {
    id
    name
    color
  }
`);

// ─── Types ──────────────────────────────────────────────────────────────────

type ActivityTypeItem = ActivityType_ActivityTypeListFragment;

// ─── Component ──────────────────────────────────────────────────────────────

type ActivityTypeListProps = {
  items: ActivityTypeItem[];
  statsById?: Map<string, ActivityTypeStats>;
};

export function ActivityTypeList({ items, statsById }: ActivityTypeListProps) {
  const { formOpen, editing, openCreate, openEdit, handleOpenChange } =
    useListSection<ActivityTypeItem>();

  return (
    <>
      <PageHeader
        title="Activity Types"
        subtitle="Categories for your todos, habits, and time blocks"
        actions={
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Activity Type
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No activity types yet"
          description="Activity types categorize your todos, habits, and time blocks"
          action={
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add activity type
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const stats = statsById?.get(item.id);
            return (
              <div
                key={item.id}
                className="relative flex items-center justify-between overflow-hidden rounded-md border py-2 pl-5 pr-3"
              >
                <ColorBar color={item.color} label={item.name} />
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{item.name}</span>
                  {stats && (
                    <span className="text-xs text-muted-foreground">
                      {stats.totalTodos} todo
                      {stats.totalTodos !== 1 ? 's' : ''}
                      {' · '}
                      {stats.totalHabits} habit
                      {stats.totalHabits !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => openEdit(item)}
                  aria-label={`Edit ${item.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <ActivityTypeForm
        {...(editing !== null ? { activityType: editing } : {})}
        open={formOpen}
        onOpenChange={handleOpenChange}
      />
    </>
  );
}
