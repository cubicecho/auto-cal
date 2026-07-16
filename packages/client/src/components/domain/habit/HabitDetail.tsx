import type {
  GetHabitDetailQuery,
  Habit_HabitListFragment,
} from '@/__generated__/graphql.js';

type HabitPeriod = NonNullable<
  GetHabitDetailQuery['myHabitDetail']
>['periods'][number];
import { graphql } from '@/__generated__/index.js';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DetailHeader } from '@/components/ui/detail-header';
import { useQuery } from '@apollo/client/react';
import { Pencil } from 'lucide-react';
import { useMemo } from 'react';

const GET_HABIT_DETAIL = graphql(`
  query GetHabitDetail($habitId: ID!, $periods: Int) {
    myHabitDetail(habitId: $habitId, periods: $periods) {
      habitId
      title
      description
      priority
      estimatedLength
      frequencyCount
      frequencyUnit
      totalCompletions
      allTimeRate
      activityType {
        id
        name
        color
      }
      periods {
        label
        periodStart
        periodEnd
        completions
        target
        rate
      }
    }
  }
`);

function priorityLabel(p: number): string {
  if (p >= 100) return 'Urgent';
  if (p >= 50) return 'High';
  if (p >= 25) return 'Medium';
  return 'Low';
}

type Habit = Habit_HabitListFragment;

interface HabitDetailProps {
  habit: Habit;
  onBack: () => void;
  onEdit: (habit: Habit) => void;
}

export function HabitDetail({ habit, onBack, onEdit }: HabitDetailProps) {
  const { data, loading, error } = useQuery(GET_HABIT_DETAIL, {
    variables: { habitId: habit.id, periods: 8 },
  });

  const detail = data?.myHabitDetail;

  const maxCompletions = useMemo(() => {
    if (!detail?.periods) return 1;
    return Math.max(
      ...detail.periods.map((p: HabitPeriod) => p.completions),
      detail.periods[0]?.target ?? 1,
    );
  }, [detail?.periods]);

  return (
    <div className="space-y-4">
      <DetailHeader
        onBack={onBack}
        backLabel="Back to habits"
        color={habit.activityType?.color}
        colorLabel={habit.activityType?.name}
        title={habit.title}
        subtitle={habit.description || undefined}
        actions={
          <Button variant="outline" size="sm" onClick={() => onEdit(habit)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
        }
      />

      {/* Quick-stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Frequency',
            value: `${habit.frequencyCount}× per ${habit.frequencyUnit}`,
          },
          { label: 'Duration', value: `${habit.estimatedLength} min` },
          { label: 'Priority', value: priorityLabel(habit.priority) },
          {
            label: 'Activity',
            value: habit.activityType?.name ?? 'Unassigned',
          },
        ].map(({ label, value }) => (
          <Card key={label} className="text-center py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="text-lg font-semibold mt-0.5">{value}</p>
          </Card>
        ))}
      </div>

      {/* Loading / error states */}
      {loading && (
        <p className="text-muted-foreground text-sm">Loading stats…</p>
      )}
      {error && (
        <p className="text-destructive text-sm">
          Error loading stats: {error.message}
        </p>
      )}

      {detail && (
        <>
          {/* All-time summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">All-time summary</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-6">
              <div>
                <p className="text-3xl font-bold">{detail.totalCompletions}</p>
                <p className="text-xs text-muted-foreground">
                  total completions
                </p>
              </div>
              <div>
                <p className="text-3xl font-bold">
                  {Math.round(detail.allTimeRate * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  avg completion rate
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Per-period bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Completions per {detail.frequencyUnit}
              </CardTitle>
              <CardDescription>
                Target: {detail.frequencyCount}× per {detail.frequencyUnit}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {detail.periods.map((period: HabitPeriod) => {
                  const pct = Math.min(
                    period.completions / Math.max(maxCompletions, 1),
                    1,
                  );
                  const met = period.completions >= period.target;
                  return (
                    <div key={period.label} className="flex items-center gap-3">
                      {/* Period label */}
                      <span className="w-20 flex-shrink-0 text-right text-xs text-muted-foreground">
                        {period.label}
                      </span>
                      {/* Progress bar */}
                      <div className="relative flex-1 h-5 rounded bg-muted overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-300"
                          style={{
                            width: `${pct * 100}%`,
                            backgroundColor: met
                              ? (habit.activityType?.color ?? '#22c55e')
                              : '#94a3b8',
                          }}
                        />
                        {/* Target marker */}
                        <div
                          className="absolute top-0 bottom-0 w-px bg-foreground/30"
                          style={{
                            left: `${(period.target / Math.max(maxCompletions, 1)) * 100}%`,
                          }}
                        />
                      </div>
                      {/* Count label */}
                      <span
                        className={`w-12 flex-shrink-0 text-xs font-medium ${
                          met ? 'text-green-600' : 'text-muted-foreground'
                        }`}
                      >
                        {period.completions}/{period.target}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Vertical line = target. Bar uses activity type color when target
                met.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
