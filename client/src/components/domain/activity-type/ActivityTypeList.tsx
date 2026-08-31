import type {
  ActivityType_ActivityTypeListFragment,
  GetActivityTypesPageQuery,
} from '@/__generated__/graphql.js';

type ActivityTypeStats =
  GetActivityTypesPageQuery['myActivityTypeStats'][number];
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { ColorBar } from '@/components/ui/color-bar';
import { Pencil, Plus, Tag } from '@/components/ui/icons';
import { EmptyState, PageHeader } from '@/components/ui/page';
import { useListSection } from '@/hooks/useListSection';
import { Text, View } from 'react-native';
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
          <Button size="sm" onPress={openCreate}>
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
            <Button size="sm" onPress={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add activity type
            </Button>
          }
        />
      ) : (
        <View className="gap-2">
          {items.map((item) => {
            const stats = statsById?.get(item.id);
            return (
              <View
                key={item.id}
                className="relative flex-row items-center justify-between overflow-hidden rounded-md border py-2 pl-5 pr-3"
              >
                <ColorBar color={item.color} label={item.name} />
                <View className="flex-row items-center gap-3">
                  <Text className="text-sm font-medium text-foreground">
                    {item.name}
                  </Text>
                  {stats && (
                    <Text className="text-xs text-muted-foreground">
                      {stats.totalTodos} todo
                      {stats.totalTodos !== 1 ? 's' : ''}
                      {' · '}
                      {stats.totalHabits} habit
                      {stats.totalHabits !== 1 ? 's' : ''}
                    </Text>
                  )}
                </View>
                <Button
                  size="icon"
                  variant="ghost"
                  onPress={() => openEdit(item)}
                  aria-label={`Edit ${item.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </View>
            );
          })}
        </View>
      )}

      <ActivityTypeForm
        {...(editing !== null ? { activityType: editing } : {})}
        open={formOpen}
        onOpenChange={handleOpenChange}
      />
    </>
  );
}
