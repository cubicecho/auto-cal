import type {
  GetActivityTypeStatsWithRangeQuery,
  GetMyStatsQuery,
} from '@/__generated__/graphql.js';
import { graphql } from '@/__generated__/index.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@apollo/client/react';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

const GET_MY_STATS = graphql(`
  query GetMyStats($startDate: String, $endDate: String) {
    myStats(startDate: $startDate, endDate: $endDate) {
      weightedScore
      habitScore
      todoScore
      habits {
        habitId
        title
        completionRate
        completions
        target
        frequencyUnit
        frequencyCount
        activityType {
          id
          color
        }
      }
      todos {
        total
        completed
        overdue
        completionRate
      }
    }
  }
`);

const GET_ACTIVITY_TYPE_STATS_WITH_RANGE = graphql(`
  query GetActivityTypeStatsWithRange($startDate: String, $endDate: String) {
    myActivityTypeStats(startDate: $startDate, endDate: $endDate) {
      activityTypeId
      activityTypeName
      totalTodos
      completedTodos
      totalHabits
    }
    myActivityTypes {
      id
      name
      color
    }
  }
`);

type DateRangeKey = 'week' | 'month' | 'three_months' | 'all';

const DATE_RANGES: Array<{
  key: DateRangeKey;
  label: string;
  days: number | null;
}> = [
  { key: 'week', label: 'This week', days: 7 },
  { key: 'month', label: 'This month', days: 30 },
  { key: 'three_months', label: 'Last 3 months', days: 90 },
  { key: 'all', label: 'All time', days: null },
];

function getDateRange(key: DateRangeKey): {
  startDate?: string;
  endDate: string;
} {
  const now = new Date();
  const endDate = now.toISOString();
  // biome-ignore lint/style/noNonNullAssertion: key always comes from DATE_RANGES
  const range = DATE_RANGES.find((r) => r.key === key)!;
  if (range.days === null) return { endDate };
  const start = new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000);
  return { startDate: start.toISOString(), endDate };
}

function scoreLabel(pct: number): string {
  if (pct >= 80) return 'On track';
  if (pct >= 50) return 'Needs attention';
  return 'Off track';
}

function scoreColor(pct: number): string {
  if (pct >= 80) return 'text-green-600 dark:text-green-400';
  if (pct >= 50) return 'text-amber-500 dark:text-amber-400';
  return 'text-destructive';
}

type StatsData = NonNullable<GetMyStatsQuery['myStats']>;
type HabitRow = StatsData['habits'][number];
type TodoRow = StatsData['todos'];
type ActivityTypeStatRow =
  GetActivityTypeStatsWithRangeQuery['myActivityTypeStats'][number];
type ActivityTypeRow =
  GetActivityTypeStatsWithRangeQuery['myActivityTypes'][number];

function ScoreCard({
  label,
  score,
  note,
}: {
  label: string;
  score: number | null | undefined;
  note?: string;
}) {
  if (score == null) {
    return (
      <Card className="flex-1 min-w-0">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold text-muted-foreground">—</p>
          <p className="text-xs text-muted-foreground mt-1">No data yet</p>
        </CardContent>
      </Card>
    );
  }

  const pct = Math.round(score * 100);
  return (
    <Card className="flex-1 min-w-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${scoreColor(pct)}`}>{pct}%</p>
        <p className="text-xs text-muted-foreground mt-1">
          {scoreLabel(pct)}
          {note && (
            <span className="ml-1 text-muted-foreground/70">{note}</span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

function HabitConsistencySection({ habits }: { habits: HabitRow[] }) {
  const [containerWidth, setContainerWidth] = useState(0);

  const initialSpacing = 8;
  // No y-axis labels — each bar's topLabelComponent already shows the %.
  // This means width = containerWidth with no offsets to subtract.
  const slotWidth = Math.max(
    28,
    Math.floor((containerWidth - initialSpacing) / Math.max(habits.length, 1)),
  );
  const barWidth = Math.min(40, Math.floor(slotWidth * 0.65));
  const spacing = slotWidth - barWidth;

  const barData = habits.map((h) => ({
    value: Math.min(Math.round(h.completionRate * 100), 100),
    label: h.title.length > 10 ? `${h.title.slice(0, 9).trimEnd()}…` : h.title,
    frontColor: h.activityType?.color ?? '#94a3b8',
    topLabelComponent: () => (
      <span style={{ fontSize: 10 }}>
        {Math.min(Math.round(h.completionRate * 100), 100)}%
      </span>
    ),
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Habit consistency</CardTitle>
      </CardHeader>
      <CardContent>
        {habits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No habits yet.</p>
        ) : (
          <View
            style={{ width: '100%' }}
            onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
          >
            {containerWidth > 0 && (
              <BarChart
                data={barData}
                barWidth={barWidth}
                initialSpacing={initialSpacing}
                spacing={spacing}
                barBorderRadius={4}
                hideYAxisText
                yAxisThickness={0}
                xAxisThickness={1}
                xAxisColor="#e2e8f0"
                maxValue={100}
                noOfSections={5}
                labelWidth={0}
                xAxisLabelTextStyle={{ fontSize: 10, color: '#64748b' }}
                width={containerWidth}
                height={180}
                endSpacing={0}
                disableScroll
              />
            )}
          </View>
        )}
        {habits.length > 0 && <HabitCompletionBreakdown habits={habits} />}
      </CardContent>
    </Card>
  );
}

function HabitCompletionBreakdown({ habits }: { habits: HabitRow[] }) {
  return (
    <div className="mt-5 border-t border-border pt-3">
      <div className="flex items-center gap-2 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <span className="w-2.5 shrink-0" />
        <span className="flex-1">Habit</span>
        <span className="w-24 text-right">Completed / Goal</span>
        <span className="w-20 text-right">Cadence</span>
      </div>
      <div className="space-y-1">
        {habits.map((h) => {
          // `target` is the goal projected over the selected range (may be
          // fractional across multiple periods); round for a readable count.
          const goal = Math.max(1, Math.round(h.target));
          const met = h.completions >= goal;
          return (
            <div
              key={h.habitId}
              className="flex items-center gap-2 py-0.5 text-sm"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: h.activityType?.color ?? '#94a3b8' }}
              />
              <span className="flex-1 truncate">{h.title}</span>
              <span className="w-24 text-right tabular-nums">
                <span
                  className={`font-semibold ${met ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}
                >
                  {h.completions}
                </span>
                <span className="text-muted-foreground"> / {goal}</span>
              </span>
              <span className="w-20 text-right text-xs text-muted-foreground">
                {h.frequencyCount}×/{h.frequencyUnit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TodoThroughputSection({
  todos,
  todoScore,
}: { todos: TodoRow; todoScore: number | null | undefined }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Todo throughput</CardTitle>
      </CardHeader>
      <CardContent>
        {todos.total === 0 ? (
          <p className="text-sm text-muted-foreground">
            No todos due in this period.
          </p>
        ) : (
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-2xl font-bold">{todos.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {todos.completed}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
            {todos.overdue > 0 && (
              <div>
                <p className="text-2xl font-bold text-destructive">
                  {todos.overdue}
                </p>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            )}
            <div>
              <p className="text-2xl font-bold">
                {todoScore != null ? `${Math.round(todoScore * 100)}%` : '—'}
              </p>
              <p className="text-xs text-muted-foreground">Completion rate</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityTypeBreakdownSection({
  stats,
  activityTypes,
}: {
  stats: ActivityTypeStatRow[];
  activityTypes: ActivityTypeRow[];
}) {
  const colorById = new Map(activityTypes.map((at) => [at.id, at.color]));
  const rows = stats.filter((s) => s.totalTodos > 0 || s.totalHabits > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Activity type breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No data for this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground text-xs border-b border-border">
                  <th className="pb-2 font-medium">Activity type</th>
                  <th className="pb-2 font-medium text-right">Todos</th>
                  <th className="pb-2 font-medium text-right">Completed</th>
                  <th className="pb-2 font-medium text-right">Habits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rows.map((row) => {
                  const color = colorById.get(row.activityTypeId) ?? '#94a3b8';
                  const completionPct =
                    row.totalTodos > 0
                      ? Math.round((row.completedTodos / row.totalTodos) * 100)
                      : null;
                  return (
                    <tr key={row.activityTypeId} className="py-2">
                      <td className="py-2">
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium">
                            {row.activityTypeName}
                          </span>
                        </span>
                      </td>
                      <td className="py-2 text-right">{row.totalTodos}</td>
                      <td className="py-2 text-right">
                        <span>
                          {row.completedTodos}
                          {completionPct !== null && (
                            <span className="text-muted-foreground ml-1">
                              ({completionPct}%)
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2 text-right">{row.totalHabits}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StatsPage() {
  const [range, setRange] = useState<DateRangeKey>('month');
  const variables = useMemo(() => getDateRange(range), [range]);

  const { data, loading, error } = useQuery(GET_MY_STATS, {
    variables,
    fetchPolicy: 'cache-and-network',
  });
  const { data: activityData, loading: activityLoading } = useQuery(
    GET_ACTIVITY_TYPE_STATS_WITH_RANGE,
    { variables, fetchPolicy: 'cache-and-network' },
  );

  const stats: StatsData | undefined = data?.myStats;
  const isLoading = loading || activityLoading;

  return (
    <div className="container mx-auto flex-1 overflow-y-auto px-4 py-6 space-y-6">
      <div className="flex gap-1 flex-wrap">
        {DATE_RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              range === r.key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <p className="text-muted-foreground text-sm">Loading stats…</p>
      )}
      {error && (
        <p className="text-destructive text-sm">Error: {error.message}</p>
      )}

      {stats && (
        <>
          <div className="flex gap-4 flex-wrap sm:flex-nowrap">
            <ScoreCard
              label="Weighted score"
              score={stats.weightedScore}
              note="(habit 50% + todo 50%)"
            />
            <ScoreCard label="Habit score" score={stats.habitScore} />
            <ScoreCard label="Todo score" score={stats.todoScore} />
          </div>

          <HabitConsistencySection habits={stats.habits} />

          <TodoThroughputSection
            todos={stats.todos}
            todoScore={stats.todoScore}
          />
        </>
      )}

      {activityData && (
        <ActivityTypeBreakdownSection
          stats={activityData.myActivityTypeStats}
          activityTypes={activityData.myActivityTypes}
        />
      )}
    </div>
  );
}
