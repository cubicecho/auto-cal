import type {
  ActivityType_ActivityTypeListFragment,
  GetActivityTypeStatsQuery,
} from '@/__generated__/graphql.js';

type ActivityTypeStats =
  GetActivityTypeStatsQuery['myActivityTypeStats'][number];
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import { ColorBar } from '@/components/ui/color-bar';
import { Pencil, Plus, Tag } from 'lucide-react';
import { useState } from 'react';
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
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActivityTypeItem | null>(null);

  function openCreate() {
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: ActivityTypeItem) {
    setEditingItem(item);
    setFormOpen(true);
  }

  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingItem(null);
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Activity Types</h2>
          <p className="text-sm text-muted-foreground">
            Categories for your todos, habits, and time blocks
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Activity Type
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="rounded-full bg-muted p-3">
            <Tag className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">No activity types yet</p>
            <p className="text-sm text-muted-foreground">
              Activity types categorize your todos, habits, and time blocks
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add activity type
          </Button>
        </div>
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
        {...(editingItem !== null ? { activityType: editingItem } : {})}
        open={formOpen}
        onOpenChange={handleFormOpenChange}
      />
    </>
  );
}
